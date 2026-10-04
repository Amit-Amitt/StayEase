process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-only-jwt-secret-with-more-than-thirty-two-characters';
process.env.CLIENT_URL = 'http://localhost:5173';

const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const User = require('../models/User');
const app = require('../app');

let mongo;
let httpServer;
let apiUrl;
const originalInfo = console.info;

const setup = async () => {
    console.info = () => {};
    mongo = await MongoMemoryServer.create();
    await mongoose.connect(mongo.getUri());
    httpServer = app.listen(0);
    await new Promise((resolve) => httpServer.once('listening', resolve));
    apiUrl = `http://127.0.0.1:${httpServer.address().port}/api`;
};

const teardown = async () => {
    console.info = originalInfo;
    if (httpServer) await new Promise((resolve) => httpServer.close(resolve));
    await mongoose.disconnect();
    if (mongo) await mongo.stop();
};

const request = async (path, { method = 'GET', body, token, cookie } = {}) => {
    const headers = {};
    if (body !== undefined) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    if (cookie) headers.Cookie = cookie;
    const response = await fetch(`${apiUrl}${path}`, {
        method,
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) })
    });
    return {
        status: response.status,
        data: response.status === 204 ? null : await response.json(),
        setCookie: response.headers.get('set-cookie')
    };
};

const cookieValue = (header) => header?.split(';', 1)[0];
const tokenFromUrl = (url) => new URL(url).searchParams.get('token');

const createUser = (role, email) => User.create({
    name: role,
    email,
    password: 'long-test-password',
    role,
    emailVerified: true
});

const signIn = async (email, password = 'long-test-password') => {
    const result = await request('/auth/login', { method: 'POST', body: { email, password } });
    assert.equal(result.status, 200);
    return { token: result.data.token, cookie: cookieValue(result.setCookie), user: result.data.user };
};

const authLifecycleTest = async () => {
    const invalid = await request('/auth/register', {
        method: 'POST',
        body: { name: 'A', email: 'not-an-email', password: 'short' }
    });
    assert.equal(invalid.status, 400);

    const attemptedEscalation = await request('/auth/register', {
        method: 'POST',
        body: { name: 'Test Guest', email: 'guest@stayease.test', password: 'long-test-password', role: 'ADMIN' }
    });
    assert.equal(attemptedEscalation.status, 400);

    const registration = await request('/auth/register', {
        method: 'POST',
        body: { name: 'Test Guest', email: 'guest@stayease.test', password: 'long-test-password' }
    });
    assert.equal(registration.status, 201);
    assert.ok(registration.data.verificationUrl);
    let user = await User.findOne({ email: 'guest@stayease.test' }).select('+password');
    assert.equal(user.role, 'USER');
    assert.equal(user.emailVerified, false);
    assert.notEqual(user.password, 'long-test-password');
    assert.equal(await user.matchPassword('long-test-password'), true);

    const blockedLogin = await request('/auth/login', {
        method: 'POST',
        body: { email: 'guest@stayease.test', password: 'long-test-password' }
    });
    assert.equal(blockedLogin.status, 401);
    assert.equal(blockedLogin.data.message, 'Invalid email or password');

    const verification = await request('/auth/verify-email', {
        method: 'POST',
        body: { token: tokenFromUrl(registration.data.verificationUrl) }
    });
    assert.equal(verification.status, 200);
    user = await User.findOne({ email: 'guest@stayease.test' });
    assert.equal(user.emailVerified, true);

    const session = await signIn('guest@stayease.test');
    assert.equal(session.user.role, 'USER');
    assert.ok(session.cookie.includes('stayease_refresh='));
    user = await User.findOne({ email: 'guest@stayease.test' });
    assert.notEqual(user.refreshTokens[0].tokenHash, session.cookie.split('=')[1]);

    const profile = await request('/users/profile', { token: session.token });
    assert.equal(profile.status, 200);
    assert.equal(profile.data.email, 'guest@stayease.test');
    assert.equal((await request('/users/profile')).status, 401);

    const refreshAttempts = await Promise.all([
        request('/auth/refresh', { method: 'POST', cookie: session.cookie }),
        request('/auth/refresh', { method: 'POST', cookie: session.cookie })
    ]);
    assert.deepEqual(refreshAttempts.map((result) => result.status).sort(), [200, 401]);
    const refreshed = refreshAttempts.find((result) => result.status === 200);
    assert.equal(refreshed.status, 200);
    const rotatedCookie = cookieValue(refreshed.setCookie);
    assert.notEqual(rotatedCookie, session.cookie);
    assert.equal((await request('/users/profile', { token: session.token })).status, 401);
    assert.equal((await request('/users/profile', { token: refreshed.data.token })).status, 200);
    assert.equal((await request('/auth/refresh', { method: 'POST', cookie: session.cookie })).status, 401);

    const logout = await request('/auth/logout', { method: 'POST', cookie: rotatedCookie });
    assert.equal(logout.status, 204);
    assert.equal((await request('/auth/refresh', { method: 'POST', cookie: rotatedCookie })).status, 401);

    const resetRequest = await request('/auth/forgot-password', {
        method: 'POST',
        body: { email: 'guest@stayease.test' }
    });
    assert.equal(resetRequest.status, 200);
    assert.ok(resetRequest.data.resetUrl);
    const beforeResetSession = await signIn('guest@stayease.test');
    const reset = await request('/auth/reset-password', {
        method: 'POST',
        body: { token: tokenFromUrl(resetRequest.data.resetUrl), password: 'new-test-password' }
    });
    assert.equal(reset.status, 200);
    assert.equal((await request('/users/profile', { token: beforeResetSession.token })).status, 401);
    assert.equal((await request('/auth/login', {
        method: 'POST',
        body: { email: 'guest@stayease.test', password: 'long-test-password' }
    })).status, 401);
    const finalSession = await signIn('guest@stayease.test', 'new-test-password');
    assert.equal(finalSession.user.email, 'guest@stayease.test');

    const emailChange = await request('/users/profile', {
        method: 'PUT',
        token: finalSession.token,
        body: { name: 'Test Guest', email: 'new-guest@stayease.test' }
    });
    assert.equal(emailChange.status, 200);
    assert.equal(emailChange.data.emailVerified, false);
    assert.ok(emailChange.data.verificationUrl);
    assert.equal((await request('/auth/login', {
        method: 'POST',
        body: { email: 'new-guest@stayease.test', password: 'new-test-password' }
    })).status, 401);
    const emailVerification = await request('/auth/verify-email', {
        method: 'POST',
        body: { token: tokenFromUrl(emailChange.data.verificationUrl) }
    });
    assert.equal(emailVerification.status, 200);
    assert.equal((await signIn('new-guest@stayease.test', 'new-test-password')).user.email, 'new-guest@stayease.test');
};

const roleAuthorizationTest = async () => {
    const admin = await createUser('ADMIN', 'admin@stayease.test');
    const owner = await createUser('HOTEL_OWNER', 'owner@stayease.test');
    const otherOwner = await createUser('HOTEL_OWNER', 'other-owner@stayease.test');
    const staff = await createUser('USER', 'staff@stayease.test');
    const regular = await createUser('USER', 'regular@stayease.test');

    const adminSession = await signIn(admin.email);
    const ownerSession = await signIn(owner.email);
    const otherOwnerSession = await signIn(otherOwner.email);
    const regularSession = await signIn(regular.email);

    const roleDenied = await request(`/users/${staff.id}/role`, {
        method: 'PATCH',
        token: regularSession.token,
        body: { role: 'STAFF' }
    });
    assert.equal(roleDenied.status, 403);

    const roleAssigned = await request(`/users/${staff.id}/role`, {
        method: 'PATCH',
        token: adminSession.token,
        body: { role: 'STAFF' }
    });
    assert.equal(roleAssigned.status, 200);
    assert.equal(roleAssigned.data.role, 'STAFF');
    assert.equal((await request(`/users/${admin.id}/role`, {
        method: 'PATCH', token: adminSession.token, body: { role: 'USER' }
    })).status, 400);

    const deniedCreate = await request('/hotels', {
        method: 'POST', token: regularSession.token,
        body: { name: 'Not Allowed', location: 'Test', pricePerNight: 100 }
    });
    assert.equal(deniedCreate.status, 403);

    const createdHotel = await request('/hotels', {
        method: 'POST', token: ownerSession.token,
        body: { name: 'Owner Hotel', location: 'Test City', pricePerNight: 100, description: 'Test' }
    });
    assert.equal(createdHotel.status, 201);
    assert.equal(String(createdHotel.data.ownerId), owner.id);
    const hotelId = createdHotel.data.id;

    const ownerEdit = await request(`/hotels/${hotelId}`, {
        method: 'PUT', token: ownerSession.token, body: { name: 'My Updated Hotel' }
    });
    assert.equal(ownerEdit.status, 200);
    const foreignEdit = await request(`/hotels/${hotelId}`, {
        method: 'PUT', token: otherOwnerSession.token, body: { name: 'Hijacked Hotel' }
    });
    assert.equal(foreignEdit.status, 403);

    const assignStaff = await request(`/hotels/${hotelId}/staff`, {
        method: 'PATCH', token: ownerSession.token, body: { userId: staff.id, action: 'add' }
    });
    assert.equal(assignStaff.status, 200);
    const staffSession = await signIn(staff.email);
    const bookings = await request(`/bookings/hotel/${hotelId}`, { token: staffSession.token });
    assert.equal(bookings.status, 200);
    assert.deepEqual(bookings.data, []);
    const unrelatedStaff = await createUser('STAFF', 'unrelated-staff@stayease.test');
    const unrelatedSession = await signIn(unrelatedStaff.email);
    assert.equal((await request(`/bookings/hotel/${hotelId}`, { token: unrelatedSession.token })).status, 403);
};

const main = async () => {
    await setup();
    try {
        await authLifecycleTest();
        console.log('PASS authentication lifecycle');
        await roleAuthorizationTest();
        console.log('PASS role and resource authorization');
    } finally {
        await teardown();
    }
};

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});

const { createPublicKey, createVerify } = require('node:crypto');

const GOOGLE_CERTS_URL = 'https://www.googleapis.com/oauth2/v3/certs';
let cachedKeys;
let cacheExpiresAt = 0;
let pendingKeyRequest;

class GoogleTokenError extends Error {
    constructor(message, code = 'invalid_token') {
        super(message);
        this.name = 'GoogleTokenError';
        this.code = code;
    }
}

const loadGoogleKeys = async (forceRefresh = false) => {
    if (!forceRefresh && cachedKeys && cacheExpiresAt > Date.now()) return cachedKeys;
    if (pendingKeyRequest) return pendingKeyRequest;

    pendingKeyRequest = (async () => {
        let response;
        try {
            response = await fetch(GOOGLE_CERTS_URL, { signal: AbortSignal.timeout(5000) });
        } catch {
            throw new GoogleTokenError('Google signing keys could not be reached', 'unavailable');
        }
        if (!response.ok) {
            throw new GoogleTokenError('Google signing keys could not be loaded', 'unavailable');
        }

        let body;
        try {
            body = await response.json();
        } catch {
            throw new GoogleTokenError('Google signing keys could not be read', 'unavailable');
        }
        if (!Array.isArray(body.keys)) {
            throw new GoogleTokenError('Google signing keys are unavailable', 'unavailable');
        }

        const maxAge = response.headers.get('cache-control')?.match(/max-age=(\d+)/i)?.[1];
        cachedKeys = new Map(body.keys.filter((key) => key.kid && key.kty === 'RSA').map((key) => [key.kid, key]));
        cacheExpiresAt = Date.now() + (maxAge ? Number(maxAge) * 1000 : 5 * 60 * 1000);
        return cachedKeys;
    })();

    try {
        return await pendingKeyRequest;
    } finally {
        pendingKeyRequest = undefined;
    }
};

const parseJsonSegment = (segment) => {
    try {
        const value = JSON.parse(Buffer.from(segment, 'base64url').toString('utf8'));
        if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected an object');
        return value;
    } catch {
        throw new GoogleTokenError('Google credential is malformed');
    }
};

const verifySignature = async (header, signingInput, signature) => {
    let key = (await loadGoogleKeys()).get(header.kid);
    if (!key) key = (await loadGoogleKeys(true)).get(header.kid);
    if (!key) throw new GoogleTokenError('Google credential uses an unknown signing key');

    let publicKey;
    try {
        publicKey = createPublicKey({ key, format: 'jwk' });
    } catch {
        throw new GoogleTokenError('Google signing key is invalid', 'unavailable');
    }

    const verifier = createVerify('RSA-SHA256');
    verifier.update(signingInput);
    verifier.end();
    if (!verifier.verify(publicKey, signature)) {
        throw new GoogleTokenError('Google credential signature is invalid');
    }
};

const verifyGoogleCredential = async (credential, clientId) => {
    const segments = typeof credential === 'string' ? credential.split('.') : [];
    if (segments.length !== 3) throw new GoogleTokenError('Google credential is malformed');

    const header = parseJsonSegment(segments[0]);
    if (header.alg !== 'RS256' || typeof header.kid !== 'string' || !header.kid || header.kid.length > 200) {
        throw new GoogleTokenError('Google credential uses an unsupported signing method');
    }
    await verifySignature(header, `${segments[0]}.${segments[1]}`, Buffer.from(segments[2], 'base64url'));

    const claims = parseJsonSegment(segments[1]);
    const now = Math.floor(Date.now() / 1000);
    const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
    if (!clientId || !audiences.includes(clientId) || (claims.azp && claims.azp !== clientId) || (audiences.length > 1 && claims.azp !== clientId)) {
        throw new GoogleTokenError('Google credential was issued for a different application');
    }
    if (!['accounts.google.com', 'https://accounts.google.com'].includes(claims.iss)) {
        throw new GoogleTokenError('Google credential has an invalid issuer');
    }
    const invalidIssuedAt = claims.iat !== undefined && (!Number.isFinite(claims.iat) || claims.iat > now + 60);
    const invalidNotBefore = claims.nbf !== undefined && (!Number.isFinite(claims.nbf) || claims.nbf > now);
    if (!Number.isFinite(claims.exp) || claims.exp <= now || invalidIssuedAt || invalidNotBefore) {
        throw new GoogleTokenError('Google credential has expired or is not yet valid');
    }
    if (typeof claims.sub !== 'string' || !claims.sub || claims.sub.length > 255 || typeof claims.email !== 'string' || !(claims.email_verified === true || claims.email_verified === 'true')) {
        throw new GoogleTokenError('Google credential does not contain a verified email');
    }

    const email = claims.email.trim().toLowerCase();
    const name = ((typeof claims.name === 'string' && claims.name.trim()) || email.split('@')[0]).slice(0, 80);
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw new GoogleTokenError('Google account details are invalid');
    }

    return { googleId: claims.sub, email, name };
};

module.exports = { GoogleTokenError, verifyGoogleCredential };

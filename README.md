<<<<<<< HEAD
# 🏨 StayEase — Hotel Booking Platform

StayEase is a full-stack hotel booking web application built using the MERN stack. It allows users to browse hotels, book rooms, and manage reservations, while admins can manage listings and bookings.

---

## 🚀 Live Demo

* 🌐 Live Link: https://stay-ease-six-xi.vercel.app/

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/amit-amitt/StayEase.git
cd StayEase
```

---

### 2️⃣ Setup Backend

```bash
cd server
npm install
npm run dev
```

For local email testing, SMTP is optional. Without SMTP, verification and reset links are printed by the API and included in development responses. To send email locally or in production, configure these values:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-user
SMTP_PASS=your-smtp-password
SMTP_FROM=StayEase <no-reply@example.com>
```

Create `client/.env` and start the client:

```env
VITE_API_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

```bash
cd client
npm install
npm run dev
```

Register with an email you can access, then open the verification link. In development without SMTP, the link is available in the API response and its console output.

### Google sign-in setup

Create an OAuth 2.0 Client ID for a Web application in Google Cloud Console. Add each deployed client host (and `http://localhost:5173` for local development) to its authorized JavaScript origins. Put that client ID in both `server/.env` as `GOOGLE_CLIENT_ID` and `client/.env` as `VITE_GOOGLE_CLIENT_ID`; the server checks the Google credential signature and audience before creating or signing in a StayEase user. No client secret or redirect URI is used by this Google Identity Services flow.

## Admin setup

Create the first admin from the server directory with a unique email and a strong password:

```bash
ADMIN_EMAIL=admin@example.com ADMIN_PASSWORD='use-a-long-unique-password' npm run create-admin
```

Admins assign `HOTEL_OWNER`, `STAFF`, or `ADMIN` roles to other accounts through `PATCH /api/users/:id/role`. Public registration always creates a `USER` account. Existing lowercase `user` and `admin` role values are normalized to uppercase by the API.

## Authentication API

All request and response bodies use JSON. Authentication inputs are validated with Zod. Passwords require at least 8 characters and are limited to 72 UTF-8 bytes for bcrypt compatibility. Access JWTs expire after 15 minutes. Refresh tokens rotate on use, are stored hashed in MongoDB, and are set in an HTTP-only cookie scoped to `/api/auth`.

| Method | Endpoint | Access | Purpose |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Public | Create an unverified `USER` account. Body: `{ "name", "email", "password" }`. |
| `POST` | `/api/auth/verify-email` | Public | Verify a link. Body: `{ "token" }`. |
| `POST` | `/api/auth/resend-verification` | Public | Request another verification email. Body: `{ "email" }`. |
| `POST` | `/api/auth/login` | Public | Sign in. Body: `{ "email", "password" }`. Returns `{ "token", "user" }` and sets the refresh cookie. |
| `POST` | `/api/auth/google` | Public | Create an account or sign in with a verified Google ID token. Body: `{ "credential" }`. Returns `{ "token", "user" }` and sets the refresh cookie. |
| `POST` | `/api/auth/refresh` | Refresh cookie | Rotate the refresh token and return a new access token. |
| `POST` | `/api/auth/logout` | Refresh cookie | Revoke the current refresh token and clear the cookie. |
| `POST` | `/api/auth/forgot-password` | Public | Request a reset email. Body: `{ "email" }`. The response is generic to avoid account discovery. |
| `POST` | `/api/auth/reset-password` | Public | Set a new password. Body: `{ "token", "password" }`. This revokes all refresh sessions. |

Send the access token on protected API calls using `Authorization: Bearer <token>`. The browser client refreshes it when an API call returns 401.

## Roles and protected APIs

| Role | Access |
| --- | --- |
| `USER` | Own profile, saved stays, bookings, and booking flows. |
| `HOTEL_OWNER` | User access plus create and manage hotels they own; assign staff to owned hotels. |
| `STAFF` | User access plus manage assigned hotel listings and view/update those hotels' bookings. |
| `ADMIN` | User access, all hotel operations, booking management, and assigning roles. |

The API checks ownership and staff assignments on every hotel write and booking-management request. Frontend `/profile`, `/booking/*`, and `/checkout` routes require a session; `/admin` requires `ADMIN`. Frontend checks are convenience controls and do not replace API authorization.

| Method | Endpoint | Access |
| --- | --- | --- |
| `GET`, `PUT` | `/api/users/profile` | Any signed-in user |
| `POST` | `/api/users/save-hotel/:id` | Any signed-in user |
| `PATCH` | `/api/users/:id/role` | `ADMIN`; body: `{ "role": "USER\|HOTEL_OWNER\|STAFF\|ADMIN" }` |
| `GET` | `/api/hotels`, `/api/hotels/:id` | Public |
| `POST` | `/api/hotels` | `ADMIN`, `HOTEL_OWNER` |
| `PUT`, `DELETE` | `/api/hotels/:id` | `ADMIN`, assigned `HOTEL_OWNER`, or assigned `STAFF` |
| `PATCH` | `/api/hotels/:id/staff` | `ADMIN` or managing `HOTEL_OWNER`; body: `{ "userId", "action": "add\|remove" }` |
| `POST` | `/api/bookings` | Any signed-in user |
| `GET` | `/api/bookings/user` | Any signed-in user; returns only that user's bookings |
| `GET` | `/api/bookings/hotel/:hotelId` | `ADMIN`, managing `HOTEL_OWNER`, or assigned `STAFF` |
| `PATCH` | `/api/bookings/:id/status` | `ADMIN`, managing `HOTEL_OWNER`, or assigned `STAFF`; status is `Confirmed`, `Cancelled`, or `Completed` |

## Production configuration

Set `NODE_ENV=production`, a random `JWT_SECRET` with at least 32 characters, `MONGO_URI`, `CLIENT_URL`, `ALLOWED_ORIGINS` with explicit comma-separated frontend origins, and the SMTP settings above. Production startup rejects missing email/origin configuration and wildcard origins. Deploy the client and API together by building `client` and serving its `dist` directory from the API, or deploy them separately and set `VITE_API_URL` to the API's `/api` URL.

To offer Google sign-in in production, set `GOOGLE_CLIENT_ID` on the API and the same value as `VITE_GOOGLE_CLIENT_ID` when building the client. Add every production client origin to the OAuth application's authorized JavaScript origins.

## Verification

Run authentication and authorization integration tests with:

```bash
cd server
npm test
```

The tests use `mongodb-memory-server`; no external database is needed.

<<<<<<< HEAD
# 🏨 StayEase — Hotel Booking Platform

StayEase is a full-stack hotel booking web application built using the MERN stack. It allows users to browse hotels, book rooms, and manage reservations, while admins can manage listings and bookings.

---

## 🚀 Live Demo

* 🌐 Frontend: https://stay-ease-six-xi.vercel.app/
* 🔗 Backend API: https://stayease-pswe.onrender.com

---

## 🧰 Tech Stack

### Frontend

* React (Vite)
* Tailwind CSS
* Axios
* React Router

### Backend

* Node.js
* Express.js
* MongoDB (Mongoose)
* JWT Authentication

### Deployment

* Frontend: Vercel
* Backend: Render
* Database: MongoDB Atlas

---

## ✨ Features

### 👤 User Features

* User registration & login
* Browse hotels & rooms
* Book rooms
* View bookings

### 🛠️ Admin Features

* Add / Edit / Delete hotels
* Manage bookings
* Dashboard overview

---

## 📁 Project Structure

```
StayEase/
├── client/     # React frontend
├── server/     # Express backend
```

---

## ⚙️ Installation & Setup

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/StayEase.git
cd StayEase
```

---

### 2️⃣ Setup Backend

```bash
cd server
npm install
```

Create `.env` file inside `server/`:

```
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
```

Run backend:

```bash
npm run dev
```

---

### 3️⃣ Setup Frontend
=======
# StayEase

StayEase is a full-stack hotel booking app with a Vite/React client and an Express/MongoDB API.

## Local development

Client:
>>>>>>> 83fd36d (fix 404)

```bash
cd client
npm install
<<<<<<< HEAD
```

Create `.env` file inside `client/`:

```
VITE_API_URL=http://localhost:5000
```

Run frontend:

```bash
npm run dev
```

---

## 🌐 Deployment

### Backend (Render)

* Set Root Directory: `server`
* Build Command: `npm install`
* Start Command: `node server.js`
* Add environment variables

### Frontend (Vercel)

* Set Root Directory: `client`
* Build Command: `npm run build`
* Output Directory: `dist`
* Add environment variable:

```
VITE_API_URL=https://your-backend.onrender.com
```

---

## 🔐 Environment Variables

### Backend (`server/.env`)

```
MONGO_URI=
JWT_SECRET=
PORT=
```

### Frontend (`client/.env`)

```
VITE_API_URL=
```

---

## ⚠️ Common Issues

* CORS error → fix backend CORS config
* MongoDB connection error → whitelist IP in Atlas
* API not working → check environment variables

---

## 📸 Screenshots

(Add your project screenshots here)

---

## 📌 Future Improvements

* Payment integration (Stripe/Razorpay)
* Reviews & ratings system
* Email notifications
* Advanced search filters

---

## 🤝 Contributing

Contributions are welcome! Feel free to fork this repo and submit a pull request.

---

## 📄 License

This project is licensed under the MIT License.

---

## 👨‍💻 Author

**Amit**

* GitHub: https://github.com/Amit-Amitt

---

⭐ If you like this project, give it a star!
=======
npm run dev
```

Server:

```bash
cd server
npm install
npm run dev
```

Use these environment variables while developing:

- `client/.env`: `VITE_API_URL=http://localhost:5002/api`
- `server/.env`: `PORT`, `MONGO_URI`, `JWT_SECRET`, `ALLOWED_ORIGINS`, `NODE_ENV`

## Deployment

### Option 1: Single deployment for API + frontend

Build the client, then run the server:

```bash
cd client
npm install
npm run build

cd ../server
npm install
npm start
```

Recommended production env:

- Server:
  - `NODE_ENV=production`
  - `PORT=<platform port>`
  - `MONGO_URI=<your mongo connection string>`
  - `JWT_SECRET=<strong secret>`
  - `ALLOWED_ORIGINS=https://your-frontend-domain.com`
- Client:
  - Leave `VITE_API_URL` unset to use same-origin `/api`, or set `VITE_API_URL=/api`

### Option 2: Separate frontend and backend deployments

- Deploy `server/` as the API service
- Deploy `client/` as the frontend service
- Set `client` env `VITE_API_URL=https://your-api-domain.com/api`
- Set `server` env `ALLOWED_ORIGINS=https://your-frontend-domain.com`

## Production checks

- `GET /api/health` returns server health info for uptime checks
- Unknown API routes return JSON 404 responses
- The server validates required env vars on startup
- CORS is controlled by `ALLOWED_ORIGINS`
>>>>>>> 83fd36d (fix 404)

# Codenap Salary & Stipend Receipt System

Internal full-stack Admin Portal for **Codenap IT Services Private Limited** to calculate, preview, customize, archive, and print/export worker, intern, and employee stipend/salary receipts in INR (`₹`).

---

## Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS (`Plus Jakarta Sans` + `JetBrains Mono`), React Router, Lucide Icons
- **Backend:** Node.js (ESM), Express, Mongoose (MongoDB), JWT (`HttpOnly` cookie sessions), Double-Submit CSRF protection, Helmet, Multer (magic-byte validated logo uploads)
- **Database:** MongoDB (connected via `MONGO_URI` in `backend/.env`)

---

## Environment Configuration

### Backend (`backend/.env`)

Configure from [`backend/.env.example`](backend/.env.example):

```env
PORT=5000
NODE_ENV=development
MONGO_URI=your_existing_mongodb_connection_string
JWT_SECRET=your_64_char_random_hex_secret
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
COOKIE_SAME_SITE=lax
SERVE_FRONTEND=auto
```

> **Database Note:** If your MongoDB Atlas URI ends with `.mongodb.net/` without a database name, Mongoose uses `test` by default. To store data in a dedicated database, append its name before `?` (e.g., `...mongodb.net/codenap_receipts?retryWrites=true&w=majority`).

### Frontend (`frontend/.env`)

For local development (uses Vite's `/api` proxy so session & CSRF cookies stay same-origin):

```env
VITE_API_BASE_URL=
VITE_API_PROXY_TARGET=http://127.0.0.1:5000
```

---

## Local Development

**Terminal 1 — Backend API (`http://127.0.0.1:5000`):**
```bash
cd backend
npm install
npm run dev
```

**Terminal 2 — Frontend App (`http://localhost:5173`):**
```bash
cd frontend
npm install
npm run dev
```

Open **`http://localhost:5173`** in your browser.

---

## Creating or Resetting Admin Accounts

- **Development (`NODE_ENV=development`):** When no users exist yet in MongoDB, `/login` shows the **First-Time Dev Setup** tab.
- **Production (`NODE_ENV=production`) or Password Reset:** Use the built-in CLI script in `backend/`:

```bash
cd backend
npm run create-admin
```

---

## Production Deployment

### Option A: Single-Server Deployment (Recommended — VPS, Render, Railway, Docker)

1. Build the frontend:
   ```bash
   cd frontend && npm install && npm run build
   ```
2. Configure `backend/.env` for HTTPS production:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGO_URI=your_mongodb_uri
   JWT_SECRET=your_strong_64_char_hex_secret
   CORS_ORIGIN=https://receipts.codenap.in
   COOKIE_SAME_SITE=lax
   SERVE_FRONTEND=auto
   ```
3. Start the backend server (which automatically serves `frontend/dist` and API routes):
   ```bash
   cd backend && npm install --omit=dev && npm start
   ```

### Option B: Split Frontend + Backend Deployment (e.g., Vercel/Netlify + Render/Railway)

1. Deploy `backend/` with `NODE_ENV=production`, `CORS_ORIGIN=https://your-frontend-domain.com`, `COOKIE_SAME_SITE=none`, and `SERVE_FRONTEND=false`.
2. Build `frontend/` with `VITE_API_BASE_URL=https://your-backend-domain.com`.

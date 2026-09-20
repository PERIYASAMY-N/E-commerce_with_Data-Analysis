# ShopInsight Deployment Guide

This guide covers the deployment of the ShopInsight platform across a modern Vercel (Frontend) and Railway (Backend/Database) stack.

## Architecture Overview

- **Frontend**: React + Vite (Static deployment on Vercel)
- **Backend**: Node.js + Express (Docker or Node runtime on Railway)
- **Database**: MySQL 8+ (Railway managed database)

## 1. Database Provisioning (Railway)

1. Create a new project on [Railway.app](https://railway.app/).
2. Provision a new **MySQL** database.
3. Once provisioned, note the connection credentials (Host, Port, User, Password, Database Name).

## 2. Backend Deployment (Railway)

1. Add a new **GitHub Repo** service to your Railway project.
2. Select the repository containing ShopInsight.
3. Configure the Root Directory to `backend` (if your monorepo is deployed together, or ensure package.json is detected).
4. Set the following environment variables in Railway:
   ```env
   NODE_ENV=production
   PORT=5000 (Railway will assign one, this acts as a fallback)
   DB_HOST=<railway_mysql_host>
   DB_PORT=<railway_mysql_port>
   DB_USER=<railway_mysql_user>
   DB_PASSWORD=<railway_mysql_password>
   DB_NAME=<railway_mysql_db>
   JWT_SECRET=<generate_a_secure_random_secret>
   JWT_EXPIRES_IN=1d
   FRONTEND_URL=https://shopinsight.vercel.app (Update once Vercel is deployed)
   ```
5. Deploy the backend service.

### Database Migrations

Once the backend service is running, you must run migrations. Use the Railway CLI or execute a remote command:

```bash
npm run migrate
```
To seed the initial admin account (if required):
```bash
npm run seed
```

## 3. Frontend Deployment (Vercel)

1. Import the GitHub repository into [Vercel](https://vercel.com/).
2. Set the **Framework Preset** to `Vite`.
3. Set the **Root Directory** to `frontend`.
4. Ensure the **Build Command** is `npm run build` and **Output Directory** is `dist`.
5. Set the following Environment Variables in Vercel:
   ```env
   VITE_API_URL=https://<your-railway-backend-domain>/api
   ```
6. Click **Deploy**.

## 4. Final Security Checklist & Configuration

- Update the Backend's `FRONTEND_URL` environment variable to exactly match the Vercel production domain to secure CORS.
- Ensure all HTTP traffic is redirected to HTTPS (Vercel and Railway handle this automatically by default).
- Verify that `POST /api/auth/register` creates customers, not admins. Admin provisioning should be done via secure seeding.

## Troubleshooting ER_ACCESS_DENIED_ERROR

If you see `ER_ACCESS_DENIED_ERROR` when running migrations or starting the backend:
1. Verify `DB_HOST` and `DB_PORT` match the provided credentials.
2. Verify `DB_USER` and `DB_PASSWORD` are absolutely correct and do not contain trailing spaces.
3. Verify `DB_NAME` exists. If you need to create it manually, connect via a MySQL client and run `CREATE DATABASE shopinsight;`.

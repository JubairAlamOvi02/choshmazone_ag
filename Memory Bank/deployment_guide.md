# Deployment Guide: Choshmazone

This guide explains how to deploy your React application to a live domain and hosting environment.

## 1. Database & Backend (Supabase)

**Good News:** You do **NOT** need to move your database.
Supabase is a cloud-hosted service. Your database is already online and accessible from anywhere in the world.

### Required Changes in Supabase Dashboard:
1.  Go to your **Supabase Dashboard** > **Authentication** > **URL Configuration**.
2.  **Site URL**: Change this from `http://localhost:5173` to your new domain (e.g., `https://www.choshmazone.com`).
3.  **Redirect URLs**: Add your new domain's production URLs:
    *   `https://www.choshmazone.com/**`
    *   `https://choshmazone.com/**`

---

## 2. Frontend Deployment Options

You have two main choices for hosting the frontend (the visible website).

### Option A: Vercel / Netlify (Recommended)
**Best for:** Speed, ease of use, automatic SSL (HTTPS), and continuous updates from GitHub.

1.  **Push your code** to GitHub.
2.  **Sign up** for Vercel (vercel.com) or Netlify (netlify.com).
3.  **Import Project**: Select your GitHub repository.
4.  **Environment Variables**:
    *   Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the hosting dashboard settings.
5.  **Deploy**: Click "Deploy". It will build and go live in minutes.
6.  **Custom Domain**: Go to Settings > Domains and add `www.choshmazone.com`. Follow the DNS instructions to point your domain.

### Option B: cPanel / Shared Hosting (Traditional)
**Best for:** If you have already purchased a standard hosting plan (e.g., Namecheap, Hostinger, local BD hosting).

> **Note for Hostinger Users:** Hostinger uses **hPanel** instead of cPanel. The process is very similar, but we have a dedicated guide for you: `Memory Bank/hostinger_deployment.md`.


#### Step 1: Build the Project
Run this command in your VS Code terminal:
```bash
npm run build
```
This creates a `dist` folder in your project directory. This folder contains the optimized production files (HTML, CSS, JS).

#### Step 2: Prepare for Client-Side Routing
React is a Single Page Application (SPA). On traditional hosting, refreshing a page like `/about` will cause a 404 error because the server looks for an `about.html` file that doesn't exist.

**Fix:** Create a file named `.htaccess` inside the `dist` folder (or create it locally and copy it there) with this content:

```apache
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase /
  RewriteRule ^index\.html$ - [L]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteCond %{REQUEST_FILENAME} !-l
  RewriteRule . /index.html [L]
</IfModule>
```

#### Step 3: Upload to Hosting
1.  Log in to your **cPanel** > **File Manager**.
2.  Go to `public_html` (or the folder for your subdomain).
3.  **Upload** all files from inside your local `dist` folder.
    *   *Note: Upload the **contents** of `dist`, not the folder itself.*
4.  Ensure the `.htaccess` file is also uploaded (you may need to enable "Show Hidden Files" in cPanel settings to see it).

---

## 3. Domain Configuration (DNS)

If you use Vercel/Netlify, they will give you `A` records or `CNAME` records to add to your domain registrar (where you bought the domain).

If you use cPanel, your domain is likely already connected.

## 4. Verification Checklist

- [ ] **Supabase URL**: Is the "Site URL" updated in Supabase Dashboard?
- [ ] **Environment Variables**: Are `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` correct in your hosted environment (or local `.env` before building)?
- [ ] **Routing**: Does refreshing a page like `/shop` or `/login` work without a 404 error? (If not, check `.htaccess` or Vercel "Rewrites" config).
- [ ] **SSL**: Is the site loading with `https://`?

## 5. Troubleshooting

**"404 Not Found" on Refresh**
*   **Cause**: Server doesn't know to send all requests to `index.html`.
*   **Fix**: Verify the `.htaccess` file exists in the root of your public folder.

**"Login Failed" / "Auth Error"**
*   **Cause**: Redirect URLs in Supabase are still pointing to localhost.
*   **Fix**: Add your production domain to Supabase Auth -> URL Configuration.

**"Connection Refused"**
*   **Cause**: Missing environment variables.
*   **Fix**: Ensure `VITE_SUPABASE_URL` is set.

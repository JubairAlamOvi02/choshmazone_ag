# Deploying to cPanel (Best Web Host BD)

Since you have cPanel hosting, you can easily host your **Frontend (Website)** there. 

### ⚠️ Critical Note About the Database
Your project uses **Supabase**, which is a special cloud platform that provides:
1.  **PostgreSQL Database** (Better than the MySQL usually found in cPanel)
2.  **Authentication System** (Login/Signup logic)
3.  **Image Storage** (Product photos)
4.  **Real-time APIs** (Live order updates)

**You cannot simply "upload" Supabase to cPanel.** Supabase replaces the need for a complex custom backend. 

**✅ The Best Strategy:**
*   **Host the Frontend** on your cPanel (Best Web Host BD).
*   **Keep the Database** on Supabase (it connects automatically over the internet).
    *   *This is standard industry practice. Your frontend in BD will talk to Supabase in the cloud perfectly.*

---

## Step 1: Prepare Your Frontend (Build)

1.  Open your project in **VS Code**.
2.  Open the Terminal (`Ctrl + ~`).
3.  Run this command to create the production files:
    ```bash
    npm run build
    ```
4.  Wait for it to finish. You will see a new folder named **`dist`** appear in your project list.

## Step 2: Prepare for Client-Side Routing (Crucial!)

React needs a special file to handle navigation (so refreshing page `www.yoursite.com/shop` doesn't give a 404 error).

1.  Go inside your new **`dist`** folder.
2.  Create a new file named **`.htaccess`**.
3.  Paste this code inside it:

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

4.  **Save the file.**

## Step 3: Upload to cPanel

1.  Log in to your **cPanel**.
2.  Go to **File Manager**.
3.  Navigate to **`public_html`**.
    *   *If you are hosting this on a subdomain (e.g., shop.yoursite.com), go to that folder instead.*
    *   *Delete any default files here (like `default.html` or `cgi-bin`) to keep it clean.*
4.  Click **Upload**.
5.  **Select Files**:
    *   Open your local **`dist`** folder.
    *   Select **ALL** files (`index.html`, `.htaccess`, `assets` folder, `vite.svg`, etc).
    *   *Tip: You can zip the contents of `dist` into `upload.zip`, upload that, and then "Extract" it in cPanel to be faster.*
6.  Once uploaded (and extracted if you used a zip), ensure `.htaccess` is visible.
    *   *If not, click "Settings" (top right) -> Check "Show Hidden Files".*

## Step 4: Connect Supabase to Your Domain

Your database needs to know your new website is safe to talk to.

1.  Go to your **[Supabase Dashboard](https://supabase.com/dashboard/)**.
2.  Click on your project -> **Authentication** (on the left) -> **URL Configuration**.
3.  **Site URL**: Change this to your new domain (e.g., `https://www.choshmazone.com`).
4.  **Redirect URLs**: Add your domain:
    *   `https://www.choshmazone.com/**`
    *   `https://choshmazone.com/**`
5.  Click **Save**.

## Step 5: Verify

1.  Visit your domain (`www.choshmazone.com`).
2.  The site should load!
3.  Try to **Log In**.
    *   If it works, your Frontend is successfully talking to your Supabase Database.

---

### FAQ: "Why can't I verify my database on cPanel?"

If you absolutely MUST move the database to cPanel (using MySQL), you would have to:
1.  **Rewrite your entire backend**: You'd need to write PHP or Node.js API servers to replace the `supabase-js` client in your React code.
2.  **Migrate Data**: Convert PostgreSQL data to MySQL.
3.  **Build Auth**: Write your own Login/Signup security system from scratch.
4.  **Build Storage**: Write code to handle file uploads to your server disk.

**This would take weeks of extra coding.** 
Using the **Hybrid Method (Frontend on cPanel + Database on Supabase)** gives you the best of both worlds: fast local hosting for the site, and powerful Google-scale database features for free.

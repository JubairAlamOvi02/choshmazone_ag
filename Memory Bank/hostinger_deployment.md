# Deploying to Hostinger

Hostinger is a great choice for hosting your React application. It uses a custom control panel called **hPanel**, which is very similar to cPanel but more modern.

## 1. Prepare Your Project (Local Computer)

Before uploading anything, you need to create the production version of your site.

1.  **Open Terminal** in VS Code.
2.  Run the build command:
    ```bash
    npm run build
    ```
3.  This creates a **`dist`** folder in your project.

### ⚠️ IMPORTANT: Handle Routing (Prevent 404 Errors)
React is a Single Page Application (SPA). By default, if you refresh a page like `/shop` on Hostinger, you might get a 404 error. You need a configuration file to fix this.

1.  Go inside your **`dist`** folder.
2.  Create a new file named **`.htaccess`** (if it doesn't exist).
3.  Paste this code into it:

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

4.  **Zip the contents**: Select all files inside `dist` (including `.htaccess`) and zip them into `website.zip`.

---

## 2. Upload to Hostinger

1.  **Log in** to your Hostinger account.
2.  Go to **Websites** in the top menu and click **Manage** next to your domain.
3.  On the left sidebar, find **Files** > **File Manager**.
4.  Select to access the files of your website (usually **public_html**).
5.  **Clean Up**:
    *   You might see a `default.php` or empty `index.php`. Delete them.
    *   Your `public_html` folder should be empty before you start.
6.  **Upload**:
    *   Click the **Upload** icon (up arrow) in the top right.
    *   Select your `website.zip` file.
7.  **Extract**:
    *   Right-click `website.zip` and select **Extract**.
    *   Extract strictly into `.` (current directory / public_html).
8.  **Verify**:
    *   You should see `index.html`, `assets` folder, and `.htaccess` directly in `public_html`.
    *   Delete the `website.zip` file to save space.

---

## 3. Update Supabase Configuration

Your database is on Supabase, so you need to tell it your new website address.

1.  Go to your **[Supabase Dashboard](https://supabase.com/dashboard/)**.
2.  Go to **Authentication** > **URL Configuration**.
3.  **Site URL**: Change `http://localhost:5173` to your Hostinger domain (e.g., `https://www.choshmazone.com`).
4.  **Redirect URLs**: Add:
    *   `https://www.choshmazone.com/**`
    *   `https://choshmazone.com/**`
5.  Click **Save**.

---

## 4. Troubleshooting Common Issues

### "404 Not Found" when refreshing pages
*   **Fix**: You missed the `.htaccess` file or put it in the wrong place. It **must** be in `public_html` alongside `index.html`.

### "Permissions Denied" or "Forbidden"
*   **Fix**: Ensure your folders (like `assets`) have permissions set to **755** and files (like `index.html`) are set to **644**. (Right-click > Permissions in File Manager).

### Review Subdomain (Optional)
If you want to test before going live on the main domain, you can create a subdomain like `dev.choshmazone.com` in Hostinger (Websites > Subdomains) and upload your files to `public_html/dev` instead.

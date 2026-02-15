# How to Fix Google Sheet Connection (403 Error)

The error "403 Forbidden" means Google is blocking the website from sending data. This is almost always due to the **Permissions** setting in the Google Apps Script deployment.

## Step 1: Open Your Script
Go to your Google Apps Script project: [Open Script](https://script.google.com/)

## Step 2: Deploy Correctly (The Most Important Part)
1. In the top right, click **Deploy** -> **New deployment**.
2. Click the specific **gear icon** (Select type) next to "Select type" and choose **Web app**.
3. Fill in the fields EXACTLY like this:
   - **Description**: `Fix Permissions`
   - **Execute as**: **Me** (your email address)
   - **Who has access**: **Anyone** (This is crucial! Do not choose "Anyone with Google Account")
4. Click **Deploy**.

## Step 3: Get the NEW URL
1. After deploying, you will see a "Web app" section with a URL.
2. **Copy** this URL entirely.
   - It should end in `/exec`.

## Step 4: Update Your Project
1. Open the file `.env` in your project folder.
2. Replace the `VITE_GOOGLE_SCRIPT_URL` with the **NEW** URL you just copied.
3. Save the file.

## Step 5: Restart the Server (Required)
1. Go to your terminal where `npm run dev` is running.
2. Press `Ctrl+C` to stop it.
3. Run `npm run dev` again to load the new settings.
4. Try placing an order again.

## Why did this happen?
Google defaults to "Only myself" or "Anyone with Google Account" for security. However, your website visitors are "anonymous" to Google (even if they are logged into your site), so you must allow **"Anyone"** to access the script to permit the data transfer.

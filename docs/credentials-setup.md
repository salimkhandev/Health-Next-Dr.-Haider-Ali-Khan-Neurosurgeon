# Credentials Setup Guide: MongoDB & Google Drive

Use this guide to set up the database and Google Drive storage configuration for local development.

---

## 1. MongoDB Configuration

Follow these steps to connect your project to your MongoDB cluster:

1. **Get the Connection String**: 
   * Go to your MongoDB Atlas dashboard, click **Connect** on your cluster, select **Drivers**, and copy the connection string.
   * Format: `mongodb+srv://<username>:<password>@cluster0.xxxx.mongodb.net/?appName=Cluster0`

2. **URL-Encode your Password**: 
   * If your database password contains special characters, you must URL-encode them before placing them in the connection string:
     * `@` becomes `%40`
     * `%` becomes `%25`
   * *Example:* `SKdev@99%22h11aSIM` becomes `SKdev%4099%2522h11aSIM`

3. **Save to `.env.local`**:
   * In `.env.local`, set the `MONGODB_URI` variable. Include the database name `/ilmpath_dev` right before the `?` query parameter.
   * *Example:*
     ```env
     MONGODB_URI="mongodb+srv://username:password@cluster0.xxxx.mongodb.net/ilmpath_dev?appName=Cluster0"
     ```
   * **DNS SRV Error Workaround (Local Dev Only):** If your local network or router blocks DNS SRV queries and you get `ECONNREFUSED` errors, use the standard direct host connection string format instead:
     ```env
     MONGODB_URI="mongodb://username:password@shard-00-00.mongodb.net:27017,shard-00-01.mongodb.net:27017,shard-00-02.mongodb.net:27017/ilmpath_dev?ssl=true&authSource=admin&retryWrites=true&w=majority&appName=Cluster0"
     ```

4. **Seed the Admin User**:
   * Run the seeding script to create the initial admin account in your new database:
     ```powershell
     node --env-file=.env.local scripts/seed-admin.cjs
     ```

---

## 2. Google Drive OAuth2 Configuration

Follow these steps to connect your Google Drive account to the application:

1. **Enable the API**:
   * Go to the [Google Cloud Console](https://console.cloud.google.com/).
   * Select or create a project (e.g. `Alamdar Academy`).
   * Search for **Google Drive API** and click **Enable** (100% free).

2. **Configure the OAuth Consent Screen**:
   * In the Google Cloud Console left menu, go to **APIs & Services** > **OAuth consent screen** (or **Audience** under Google Auth Platform).
   * Select **User Type: External** and click **Create**.
   * Fill in the **App name**, **User support email**, and **Developer contact email**, then save.
   * Skip Scopes (click Save and Continue).
   * **CRITICAL STEP:** Under **Test users**, click **Add Users** and add the Gmail address of the Google Drive account you want to connect.

3. **Create OAuth Credentials**:
   * Go to **APIs & Services** > **Credentials**.
   * Click **+ CREATE CREDENTIALS** > **OAuth client ID**.
   * Select **Application type: Web application**.
   * Under **Authorized redirect URIs**, click **+ ADD URI** and paste:
     `https://developers.google.com/oauthplayground`
   * Click **Create** and copy the **Client ID** and **Client Secret** into your `.env.local`:
     ```env
     GOOGLE_DRIVE_CLIENT_ID="your_client_id"
     GOOGLE_DRIVE_CLIENT_SECRET="your_client_secret"
     ```

4. **Generate the Refresh Token**:
   * Open the [Google OAuth Playground](https://developers.google.com/oauthplayground).
   * Click the **Gear icon ⚙️ (Configuration)** in the top right.
   * Check **Use your own OAuth credentials** and enter your Client ID and Client Secret. Click Close.
   * In the left panel under Step 1, expand **Drive API v3** and check:
     * `https://www.googleapis.com/auth/drive`
   * Click **Authorize APIs** and log in with your whitelisted test Gmail account.
     * *Note: Click "Advanced" -> "Go to [App Name] (unsafe)" if warned.*
   * Once redirected back to the Playground, click **Exchange authorization code for tokens** under Step 2.
   * Copy the `"refresh_token"` from the JSON response on the right and save it to `.env.local`:
     ```env
     GOOGLE_DRIVE_REFRESH_TOKEN="your_refresh_token"
     ```

5. **Set up Folder IDs**:
   * In your Google Drive, create three folders (e.g., `Videos`, `Thumbnails`, `Receipts`).
   * Open each folder and copy its ID from the URL (the text after `/folders/`).
   * Save them in `.env.local`:
     ```env
     GOOGLE_DRIVE_VIDEOS_FOLDER_ID="videos_folder_id"
     GOOGLE_DRIVE_THUMBNAILS_FOLDER_ID="thumbnails_folder_id"
     GOOGLE_DRIVE_RECEIPTS_FOLDER_ID="receipts_folder_id"
     ```

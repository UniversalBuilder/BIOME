# Data Sharing Test Guide

To verify that the **Desktop App** and **Web Mode** share the same data, you must ensure both are running in **Production Mode**.

## Why it didn't work in Development
When you run `npm run tauri-dev`, the application runs in **Development Mode**.
- **Development Mode** uses a local database file: `backend/data/database.sqlite`
- **Production Mode** (Web & Desktop) uses the shared system path: `%LOCALAPPDATA%\com.biome.desktop\biamanger\database.sqlite`

This separation prevents your development experiments from messing up your real data.

## How to Test Data Sharing

### Step 1: Run Web Mode
1. Double-click `launch-web-mode.bat` in the root directory.
2. This opens the Web App at `http://localhost:3001`.
3. Create a new project (e.g., "Web Mode Project").

### Step 2: Run Desktop Mode (Production)
Since you cannot run the production desktop app via `npm`, you have two options:

**Option A: Build and Install (Recommended)**
1. Run `npm run build-msi` in the `projet-analyse-image-frontend` folder.
2. Install the generated MSI.
3. Launch "BIOME" from your Start Menu.
4. You should see "Web Mode Project" in the list.

**Option B: Simulate Production in Dev (Advanced)**
If you want to test this without building, you can force the development app to use the production database:
1. Open `backend/src/database/db.js`.
2. Temporarily change line 38:
   ```javascript
   // return path.join(__dirname, '../../data/database.sqlite');
   return path.join(os.homedir(), 'AppData', 'Local', 'com.biome.desktop', 'biamanger', 'database.sqlite');
   ```
3. Run `npm run tauri-dev`.
4. **Revert this change** after testing to avoid corrupting your real data during development.

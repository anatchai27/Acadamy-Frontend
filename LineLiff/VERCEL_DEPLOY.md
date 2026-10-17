# Deploy LineLiff to Vercel

LineLiff is a Vite + Preact static app. The Vercel configuration keeps its existing `/liff/...` routes, supports direct navigation to nested routes, and builds assets from the Vercel project root. Non-Vercel builds continue to use `/liff/` for the current VPS deployment.

## 1. Import the project

1. Push the repository to GitHub and import it from the Vercel dashboard.
2. Set **Root Directory** to `LineLiff`.
3. Use these build settings (Vercel usually detects Vite automatically):
   - Framework preset: **Vite**
   - Install command: `npm install` (or leave the detected default)
   - Build command: `npm run build`
   - Output directory: `dist`
4. Keep the committed `vercel.json`; it rewrites `/liff` routes to the SPA entry point.

The build script invokes Vite with `node ./node_modules/vite/bin/vite.js build` rather than the generated `node_modules/.bin/vite` shim. This avoids permission-denied failures on that shim in Linux build environments. The pinned `allowScripts` entry in `package.json` permits the esbuild 0.25.12 install script so npm versions that block unreviewed dependency scripts can install its platform binary.

If a deployment reports `sh: .../node_modules/.bin/vite: Permission denied`, confirm Vercel is building the latest commit containing this package script, set **Build Command** to `npm run build` (not `vite build`), set **Install Command** to `npm ci`, and redeploy without the previous build cache. The npm `cache-dir` warning is separate from this executable permission error.

## 2. Set Environment Variables

In **Project → Settings → Environment Variables**, add these for Production (and Preview if needed):

| Name | Value |
| --- | --- |
| `VITE_LIFF_ID` | The LIFF ID configured in LINE Developers |
| `VITE_API_URL` | The public HTTPS API base URL ending in `/api`, e.g. `https://api.example.com/api` |
| `VITE_FORCE_LOGOUT` | `false` for normal sign-in; set `true` only temporarily when intentionally forcing users to re-authenticate |

`VITE_` values are embedded in browser JavaScript. Do not put passwords, private API keys, or other secrets in them. The LIFF ID is a client-side identifier, not a secret.

The existing `LineLiff/.env.production` uses `/api` for same-origin VPS hosting. On Vercel, set `VITE_API_URL` to the publicly reachable API URL above; otherwise requests would incorrectly go to the Vercel domain. Vite uses Vercel's environment values during the build.

## 3. Allow the Vercel origin on the API

Configure the API's production `Cors:AllowedOrigins` to include `https://acadamy-frontend-3nao-mu.vercel.app` (origin only; no `/liff` path). Add the production custom domain origin too if you use one, then restart/redeploy the API. The API must itself be reachable over HTTPS from the public internet.

## 4. Deploy and register the LIFF endpoint

1. Click **Deploy** and wait for the build to finish.
2. Open `https://acadamy-frontend-3nao-mu.vercel.app/liff/` and test direct reloads of routes such as `/liff/login`. The bare domain redirects to `/liff/`.
3. In LINE Developers, set the LIFF app's **Endpoint URL** to `https://acadamy-frontend-3nao-mu.vercel.app/liff/` (or the corresponding custom-domain URL). Replace the old ngrok endpoint; LIFF warns when the current page URL is outside the registered endpoint URL.
4. Test the flow inside LINE: LIFF initialization, login, child data loading, and payment API requests.

After changing a Vercel environment variable, redeploy so Vite rebuilds the client bundle with the updated value.

## 5. Existing VPS deployment

The VPS deployment remains unchanged: its Vite build keeps `base: '/liff/'`, and the existing Nginx route continues serving the app under `/liff/` with same-origin `/api` requests.
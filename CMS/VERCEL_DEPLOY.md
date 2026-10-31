# Deploy CMS to Vercel

CMS is a Next.js app. Deploy it as a separate Vercel project from this repository.

## Vercel project settings

1. Import the Git repository into Vercel.
2. Set **Root Directory** to `CMS` and enable **Include source files outside of the Root Directory** only if Vercel indicates it is required. This app's current source and dependencies are contained in `CMS`.
3. Keep the framework as **Next.js**. The committed `vercel.json` sets `npm ci` as the install command and `npm run build` as the build command.
4. Leave **Output Directory** unset so Next.js uses its default output.
5. Deploy. Vercel will build the app and provide an HTTPS deployment URL.

## Environment variables

The public CMS landing page currently does not require an environment variable to build. If API integration is added later, configure its URL and any private credentials in **Project Settings → Environment Variables**. Never put private credentials in variables prefixed with `NEXT_PUBLIC_` because those values are exposed to visitors.

## After deployment

- Open the production URL and verify the home page and image assets load.
- Follow the **เข้าสู่ระบบ** link to confirm it reaches the intended Front deployment.
- Check the deployment build log if a deployment fails; run `npm ci` and `npm run build` from the `CMS` directory to reproduce the build locally.

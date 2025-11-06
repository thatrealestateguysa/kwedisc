# Find Your Lead Gen WINWIN — Netlify Build Fix

**Why your build failed:** Netlify often defaults to Node 16. Vite 5 requires Node >= 18, so the build exits with code 2.
This repo includes `netlify.toml` and `.nvmrc` to force **Node 18**, and sets the build to `npm run build` (publish `dist`).

### Deploy via Git repo (recommended)
1. Push this folder to GitHub.
2. In Netlify, **New site from Git** → select repo.
3. Build settings are auto-read from `netlify.toml`:
   - Build command: `npm run build`
   - Publish: `dist`
   - Node: 18
4. Add environment variables (Site settings → Environment variables):
   - `VITE_EMAILJS_SERVICE_ID`
   - `VITE_EMAILJS_TEMPLATE_ID`
   - `VITE_EMAILJS_PUBLIC_KEY`

### Drag-and-drop alternative (no build needed)
1. Locally run: `npm i && npm run build`
2. Upload the **contents of `dist/`** to Netlify **Deploys → Upload a folder**.

### EmailJS
- Template should use: **To** `{{to_email}}`, **CC** `{{cc}}`, and body fields like `{{subject}}`, `{{message}}`, `{{agent_name}}`, `{{phone}}`.
- The app sends a real PDF file (`attachments: [file]`) and CCs **Dawie.dutoit@kwsa.co.za**.

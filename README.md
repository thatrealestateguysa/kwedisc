# Find Your Lead Gen WINWIN — DISC Webapp

## Deploy (Netlify)
1) Push this folder to GitHub and connect in Netlify.
2) Build command: `npm run build` • Publish dir: `dist` • Node 18.
3) Add env vars in Site settings → Build & deploy → Environment:
   - `VITE_EMAILJS_SERVICE_ID`
   - `VITE_EMAILJS_TEMPLATE_ID`
   - `VITE_EMAILJS_PUBLIC_KEY`

### EmailJS
- In your template, set **To:** `{{to_email}}` and **CC:** `{{cc}}`.
- The app sends `to_email = participant email` and `cc = Dawie.dutoit@kwsa.co.za`.
- If attachments aren’t supported on your plan, use **Download PDF**.

### Logo
Place your KW Explore PNG at `public/kw-explore-logo.png` (we copy one if available).

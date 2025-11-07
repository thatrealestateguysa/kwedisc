# Find Your Lead Gen WINWIN — Clean Multi‑Page Report
- 20 Most/Least questions → Natural & Adaptive → **6–10 page PDF** (KW red headings, black body).
- Side‑by‑side bar chart; Lead Gen plan; Negotiation playbook; communication tips by style.
- **EmailJS** sends PDF as base64 attachment; CC to Dawie by combining recipients in `to_email`.

## Netlify environment
- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`

**EmailJS template**: set **To** to `{{to_email}}` (the app passes "`user@... , Dawie.dutoit@kwsa.co.za`").

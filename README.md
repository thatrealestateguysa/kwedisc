# Find Your Lead Gen WINWIN (Clean UI)
- Inline components (no ./components imports), Vite + React 18.
- 20 Most/Least questions → Natural/Adaptive → PDF + EmailJS attachment (base64).
- CC to Dawie by combining recipients in `to_email` (comma-separated).

## Netlify variables
- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`

**EmailJS template**
Set the **To** field to `{{to_email}}`. Ensure attachments are enabled (SDK will send base64 provided in `attachments`).

Node 18 pinned via `.nvmrc` and `netlify.toml`.

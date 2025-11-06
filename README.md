# Find Your Lead Gen WINWIN
Dark, KW Explore–branded DISC webapp (Most/Least per question) that generates & emails a branded PDF.

## Quickstart
```bash
npm i
npm run dev
```

## Build & Deploy (Netlify)
- Build command: `npm run build`
- Publish directory: `dist`
- (Optional) Set environment vars if you prefer: `VITE_EMAILJS_SERVICE_ID`, `VITE_EMAILJS_TEMPLATE_ID`, `VITE_EMAILJS_PUBLIC_KEY`
- Or edit `App.tsx` constants directly.

## EmailJS template fields
- from_email → `Dawie.dutoit@kwsa.co.za`
- to_email → recipient’s email
- cc_email → `Dawie.dutoit@kwsa.co.za`
- pdf_data_base64 → attachment (base64)

## Notes
- Logo path is `/kw-explore-logo.png` (public folder)
- The on‑page report is hidden; PDF contains the results.

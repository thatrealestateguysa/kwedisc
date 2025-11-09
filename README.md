# Find Your Lead Gen WINWIN (DISC Webapp)

## Setup
1) Install: `npm i`
2) Run dev: `npm run dev`
3) Build: `npm run build`

## Netlify Environment Variables
- VITE_EMAILJS_SERVICE_ID
- VITE_EMAILJS_TEMPLATE_ID
- VITE_EMAILJS_PUBLIC_KEY

Your EmailJS template must include inputs with these exact names:
- to_email
- to_name
- from_name
- reply_to
- cc
- phone
- subject
- message
- report_pdf  (file attachment)

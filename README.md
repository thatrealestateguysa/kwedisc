# Find Your Lead Gen WINWIN (DISC webapp)

## Local
npm i
npm run dev

## Build (Netlify)
Set environment variables:
- VITE_EMAILJS_SERVICE_ID
- VITE_EMAILJS_TEMPLATE_ID
- VITE_EMAILJS_PUBLIC_KEY

Your EmailJS template fields must be named:
to_email, to_name, from_name, reply_to, cc, phone, subject, message, and **report_pdf** (file).
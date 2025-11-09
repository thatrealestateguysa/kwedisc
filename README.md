# Find Your Lead Gen WINWIN

Dark, single-page DISC questionnaire (10 work + 10 personal). Generates a multi-page PDF and emails it via EmailJS.

## Netlify ENV
- VITE_EMAILJS_SERVICE_ID
- VITE_EMAILJS_TEMPLATE_ID
- VITE_EMAILJS_PUBLIC_KEY

EmailJS template must have fields: `to_email`, `to_name`, `from_name`, `reply_to`, `cc`, `phone`, `subject`, `message`, and a **file input named `report_pdf`**.
# Find Your Lead Gen WINWIN — DISC Webapp (v4)

- Email sending now uses **EmailJS sendForm** with a hidden `<form>` and a file input so the generated PDF is attached reliably from the browser.
- Report is high‑contrast (black text, KW red headings) and paginates to multiple A4 pages.

## Netlify
Build: `npm run build` • Publish: `dist` • Node 18

## Environment variables (Netlify)
- `VITE_EMAILJS_SERVICE_ID`
- `VITE_EMAILJS_TEMPLATE_ID`
- `VITE_EMAILJS_PUBLIC_KEY`

## EmailJS template mapping
Create fields in your template with these variable names (must match the form):
- `to_email`, `to_name`, `from_name`, `reply_to`, `cc`, `phone`, `subject`, `message`
- File attachment: an input named **`report_pdf`** (EmailJS will map it automatically from `sendForm`).

If email still fails, verify your **service**, **template**, and **public key**, and that the template allows attachments.

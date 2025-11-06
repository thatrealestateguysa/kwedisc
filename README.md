# Find Your Lead Gen WINWIN (Vite + React, EmailJS attachment)

## Quick start
```bash
npm i
npm run dev
```

## Deploy (Netlify)
- Build command: `npm run build`
- Publish directory: `dist`
- Optional: `NODE_VERSION=18`

## EmailJS setup (to actually send as Dawie)
1. In EmailJS, connect a service that can send from **Dawie.dutoit@kwsa.co.za** (Gmail/SMTP).
2. Create a template and set:
   - **To**: `{{to_email}}`
   - **CC**: `{{cc}}` (to copy Dawie)
   - Subject: `{{subject}}`
   - Body fields you want: `{{message}}`, `{{agent_name}}`, `{{phone}}`
3. In Netlify → Site settings → Environment variables, add:
   - `VITE_EMAILJS_SERVICE_ID`
   - `VITE_EMAILJS_TEMPLATE_ID`
   - `VITE_EMAILJS_PUBLIC_KEY`
4. Redeploy. The app builds the PDF in-browser and sends it as a **File** via `attachments: [file]`.

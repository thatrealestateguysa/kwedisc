# Find Your Lead Gen WINWIN (Deploy-ready)

- Dark/KW theme, 20 Most/Least questions, vertical options, small detail inputs.
- Generates branded PDF and emails via EmailJS (CC: Dawie.dutoit@kwsa.co.za).

## Netlify
- `netlify.toml` pins **Node 18** and builds `dist`.
- Env vars to add:
  - `VITE_EMAILJS_SERVICE_ID`
  - `VITE_EMAILJS_TEMPLATE_ID`
  - `VITE_EMAILJS_PUBLIC_KEY`

## Local
```bash
npm i
npm run dev
```
```bash
npm run build
npm run preview
```

## EmailJS template fields
- To: `{{to_email}}`
- CC: `{{cc}}`
- Subject: `{{subject}}`
- Body: you can include `{{message}}`, `{{agent_name}}`, `{{phone}}`.

# KWE DISC Profile – Web App (Starter)

A tiny Node.js app that collects **first name, surname, email, and phone** and then **emails a DISC report PDF** to the user.
This starter ships with a sample report PDF so you can test immediately.

---

## Quick start

1. **Unzip** this package.
2. In the project folder, run:
   ```bash
   npm install
   cp .env.example .env
   # edit .env with your SMTP settings
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Visit **http://localhost:3000** and submit the form.

The app will email the **attached PDF** (see `reports/DISC_Report_Sample.pdf`). You can replace this file with your own template,
or generate custom PDFs and point `REPORT_PATH` in `.env` to the file you want to send.

---

## SMTP Notes

- You can use any SMTP provider (SendGrid, Mailgun, Amazon SES, your own server, etc.).
- For local testing, many providers allow sandbox mode or test credentials.
- The from address is set by `FROM_EMAIL`. Optional: set `ADMIN_EMAIL` to receive a notification per submission.

---

## Customize

- **Branding**: logos live in `/public`. Replace `kw-explore-logo.png` and `kwe-disc-badge.png` as needed.
- **Report**: replace `reports/DISC_Report_Sample.pdf`, or set `REPORT_PATH` in `.env` to another file.
- **Fields**: edit the form in `server.js` (GET `/`) if you want extra inputs.

---

## Deploy

This is a plain Express app; deploy anywhere that runs Node.js (Render, Railway, Fly.io, Heroku-compatible, S3+Cloudflare Tunnel, etc.).
Remember to add the same environment variables from your local `.env` in your hosting provider.

---

## License

MIT. Replace the sample report with your own licensed material before production use.

---

## GitHub Deploy Options

### 1) Deploy a Docker image to GitHub Container Registry (GHCR)
- Push this project to a new GitHub repo (default branch: `main`).
- The included workflow `.github/workflows/publish-ghcr.yml` will build and publish
  `ghcr.io/<your-username>/<repo>:latest` on every push to `main`.
- Use that container on your preferred host (Fly.io, Azure Web Apps for Containers, Render, Railway, etc.).

### 2) One-click deploy to Railway via GitHub Actions (optional)
- Create two GitHub repository secrets:
  - `RAILWAY_TOKEN` – from your Railway account
  - `RAILWAY_SERVICE_ID` – the ID of your Railway service
- The workflow `.github/workflows/railway-deploy.yml` will deploy on push to `main`.

---

## Instant Download
After a successful submission, the app now shows a **Download your report** button. The link is
a short-lived token (15 minutes) that serves the PDF with a personalized filename.

/**
 * KWE DISC Profile - Web App
 * - Dark UI
 * - Emails a DISC report (attachment)
 * - Also offers a secure "Download now" link after completion
 * - Ready for GitHub-based deploys (Docker + CI files in repo)
 */
const path = require("path");
const fs = require("fs");
const express = require("express");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const REPORT_PATH = process.env.REPORT_PATH || path.join(__dirname, "reports", "DISC_Report_Sample.pdf");

// In-memory download tokens (expires after 15 minutes)
const dlTokens = new Map();
const DL_TTL_MS = 15 * 60 * 1000;

app.use(express.urlencoded({ extended: true }));
app.use("/static", express.static(path.join(__dirname, "public"), { maxAge: "30d" }));

const escape = (s="") => String(s).replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));

app.get("/", (req, res) => {
  res.type("html").send(`
<!doctype html>
<html lang="en" class="dark">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>KWE DISC Profile</title>
<style>
  :root { --brand:#e11d2e; --brand-2:#991b1b; --ink:#e6e8ee; --sub:#aab3d3; --panel:#0b0f1d; --panel2:#0d1328; --ring:#e11d2e33; }
  * { box-sizing: border-box; }
  body { margin:0; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji";
         color: var(--ink);
         background:
           radial-gradient(1200px 800px at 50% -300px, rgba(225,29,46,0.15), transparent 70%),
           radial-gradient(800px 500px at 120% 0%, rgba(153,27,27,0.18), transparent 60%),
           #050814; }
  header { display:flex; gap:16px; align-items:center; justify-content:center; padding:26px 16px; border-bottom:1px solid rgba(255,255,255,0.06); }
  header img { max-height:56px; object-fit:contain; filter: drop-shadow(0 6px 24px rgba(225,29,46,.35)); }
  main { max-width: 880px; margin: 28px auto; padding: 0 20px 24px; }
  .card { background: linear-gradient(180deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02));
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 18px; box-shadow: 0 25px 80px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.04); overflow:hidden; }
  .card-header { padding: 22px 22px; border-bottom: 1px solid rgba(255,255,255,0.06); display:flex; align-items:center; gap:14px; background: rgba(255,255,255,0.02); }
  .badge { width: 52px; height:52px; object-fit: cover; border-radius: 999px; background: #fff2; }
  h1 { font-weight: 800; margin: 0; font-size: 1.45rem; letter-spacing: .2px; }
  p.lead { margin: 10px 0 0; color: var(--sub); }
  form { display:grid; grid-template-columns: 1fr 1fr; gap: 16px; padding: 22px; background: var(--panel2); }
  label { font-size: .9rem; color: var(--ink); opacity:.95; display:block; margin-bottom: 6px; }
  input[type="text"], input[type="email"], input[type="tel"] {
    width: 100%; background: var(--panel); border: 1px solid rgba(255,255,255,0.12); color: #f5f7ff; padding: 12px 14px; border-radius: 12px; outline: none; transition: border-color .2s, box-shadow .2s;
  }
  input:focus { border-color: var(--brand); box-shadow: 0 0 0 3px var(--ring); }
  .col-span-2 { grid-column: span 2; }
  .row { display:flex; align-items:center; gap: 10px; }
  .muted { color: var(--sub); font-size: .92rem; }
  button {
    background: linear-gradient(90deg, var(--brand), var(--brand-2));
    color: white; border: none; padding: 12px 18px; border-radius: 12px;
    font-size: 1rem; font-weight: 800; letter-spacing:.2px; cursor: pointer; transition: transform .06s ease, filter .15s ease;
    box-shadow: 0 15px 40px rgba(225,29,46,.35);
  }
  button:hover { filter: brightness(1.07); }
  button:active { transform: translateY(1px); }
  footer { text-align:center; color: var(--sub); font-size:.9rem; padding: 18px; }
  .note { padding: 10px 14px; border-radius: 12px; background:#0c1431; border:1px solid rgba(255,255,255,.08); color: var(--sub); }
  a.btn { text-decoration:none; display:inline-block; padding:10px 14px; border-radius:12px; background:var(--panel); border:1px solid rgba(255,255,255,.12); color:#f5f7ff; }
</style>
</head>
<body>
  <header>
    <img src="/static/kw-explore-logo.png" alt="KW Explore" />
    <img src="/static/kwe-disc-badge.png" alt="KWE DISC" class="badge" />
  </header>
  <main>
    <div class="card">
      <div class="card-header">
        <img src="/static/kwe-disc-badge.png" class="badge" alt="DISC"/>
        <div>
          <h1>Request your DISC profile</h1>
          <p class="lead">Fill in your details. We’ll email your report and give you an instant download.</p>
        </div>
      </div>
      <form method="POST" action="/submit" novalidate>
        <div>
          <label for="firstName">First name</label>
          <input id="firstName" name="firstName" type="text" required autocomplete="given-name" />
        </div>
        <div>
          <label for="lastName">Surname</label>
          <input id="lastName" name="lastName" type="text" required autocomplete="family-name" />
        </div>
        <div>
          <label for="email">Email</label>
          <input id="email" name="email" type="email" required autocomplete="email" />
        </div>
        <div>
          <label for="phone">Phone number</label>
          <input id="phone" name="phone" type="tel" required autocomplete="tel" />
        </div>
        <div class="col-span-2 row">
          <input id="consent" type="checkbox" name="consent" value="yes" required />
          <label for="consent" class="muted">I agree to be contacted about my DISC report.</label>
        </div>
        <div class="col-span-2 row" style="justify-content: space-between;">
          <span class="muted">You'll receive a PDF attachment and a download link.</span>
          <button type="submit">Get my report</button>
        </div>
      </form>
    </div>
    <p class="muted" style="margin-top:16px">Need help? Email <a class="btn" href="mailto:${escape(process.env.FROM_EMAIL || "hello@example.com")}">${escape(process.env.FROM_EMAIL || "hello@example.com")}</a></p>
    <div class="note" style="margin-top:10px">
      <strong>Demo:</strong> Uses the included sample report. Swap it out in <code>/reports</code>.
    </div>
  </main>
  <footer>© ${new Date().getFullYear()} KWE DISC</footer>
</body>
</html>
  `);
});

app.post("/submit", async (req, res) => {
  try {
    const firstName = (req.body.firstName || "").trim();
    const lastName = (req.body.lastName || "").trim();
    const email = (req.body.email || "").trim();
    const phone = (req.body.phone || "").trim();
    const consent = req.body.consent === "yes";

    const errors = [];
    if (!firstName) errors.push("First name is required.");
    if (!lastName) errors.push("Surname is required.");
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("A valid email is required.");
    if (!phone) errors.push("Phone number is required.");
    if (!consent) errors.push("Consent is required.");

    if (errors.length) {
      return res.status(400).type("html").send(`
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:760px;margin:40px auto;padding:24px;border-radius:14px;border:2px solid #fecaca;background:#fff1f2;color:#7f1d1d">
          <h2 style="margin:0 0 8px 0">Fix a couple of things:</h2>
          <ul>${errors.map(e => `<li>${escape(e)}</li>`).join("")}</ul>
          <p><a href="/">Back</a></p>
        </div>
      `);
    }

    if (!fs.existsSync(REPORT_PATH)) {
      throw new Error("Report file not found at " + REPORT_PATH);
    }

    // Prepare email (if SMTP is configured)
    let emailOk = false;
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS && process.env.FROM_EMAIL) {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: String(process.env.SMTP_PORT || "587") === "465",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      const fullName = `${firstName} ${lastName}`.trim();
      const attachmentFilename = `DISC Report - ${fullName}.pdf`;
      const htmlBody = `
        <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;line-height:1.5;color:#0b1020">
          <h2 style="margin:0 0 8px 0">Your DISC report</h2>
          <p>Hi ${escape(firstName)},</p>
          <p>Attached is your DISC report PDF. If you have any questions, reply to this email and our team will help.</p>
          <ul>
            <li><strong>Name:</strong> ${escape(fullName)}</li>
            <li><strong>Email:</strong> ${escape(email)}</li>
            <li><strong>Phone:</strong> ${escape(phone)}</li>
          </ul>
          <p>— KWE DISC</p>
        </div>
      `;

      await transporter.sendMail({
        from: process.env.FROM_EMAIL,
        to: email,
        subject: "Your DISC Report",
        html: htmlBody,
        attachments: [{ filename: attachmentFilename, path: REPORT_PATH, contentType: "application/pdf" }],
      });

      if (process.env.ADMIN_EMAIL) {
        await transporter.sendMail({
          from: process.env.FROM_EMAIL,
          to: process.env.ADMIN_EMAIL,
          subject: `New DISC request: ${fullName}`,
          html: `<p>New request from <strong>${escape(fullName)}</strong> (${escape(email)} / ${escape(phone)}).</p>`,
        });
      }
      emailOk = true;
    }

    // Create a download token
    const token = crypto.randomBytes(24).toString("hex");
    const fullName = `${firstName} ${lastName}`.trim();
    const filename = `DISC Report - ${fullName}.pdf`;
    dlTokens.set(token, { file: REPORT_PATH, filename, createdAt: Date.now() });

    // Cleanup expired tokens occasionally
    for (const [t, meta] of [...dlTokens.entries()]) {
      if (Date.now() - meta.createdAt > DL_TTL_MS) dlTokens.delete(t);
    }

    const dlUrl = `/download/${token}`;

    res.type("html").send(`
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:760px;margin:40px auto;padding:28px;border:1px solid #2f3a64;border-radius:16px;background:#0b0f1d;color:#e6e8ee">
        <h2 style="margin:0 0 12px 0">You're all set, ${escape(firstName)}!</h2>
        <p>${emailOk ? `We emailed your DISC report to <strong>${escape(email)}</strong>.` : `Email settings weren't configured, but you can download your report now.`}</p>
        <p><a href="${dlUrl}" style="display:inline-block;margin-top:8px;text-decoration:none;background:#e11d2e;color:#fff;padding:12px 16px;border-radius:12px;font-weight:800;">⬇ Download your report</a></p>
        <p style="margin-top:14px"><a href="/" style="color:#aab3d3">Send another</a></p>
      </div>
    `);
  } catch (err) {
    console.error("Failed to process submission:", err);
    res.status(500).type("html").send(`
      <meta name="viewport" content="width=device-width,initial-scale=1" />
      <div style="font-family:system-ui,Segoe UI,Roboto,Helvetica,Arial,sans-serif;max-width:760px;margin:40px auto;padding:24px;border:2px solid #fecaca;background:#fff1f2;border-radius:14px;color:#7f1d1d">
        <h2 style="margin-top:0">Hmm, we hit a snag.</h2>
        <p>${escape(err.message || "Unexpected error")}.</p>
        <p><a href="/">Back</a></p>
      </div>
    `);
  }
});

// Secure download route
app.get("/download/:token", (req, res) => {
  const token = req.params.token || "";
  const meta = dlTokens.get(token);
  if (!meta) return res.status(404).send("Download link expired or invalid.");
  if (Date.now() - meta.createdAt > DL_TTL_MS) {
    dlTokens.delete(token);
    return res.status(410).send("This download link has expired.");
  }
  res.download(meta.file, meta.filename);
});

app.listen(PORT, () => {
  console.log(`KWE DISC app running on http://localhost:${PORT}`);
});

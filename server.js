const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const https = require('https');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ──
app.use(cors({
  origin: '*',
  methods: ['GET','POST'],
  allowedHeaders: ['Content-Type']
}));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── FILE UPLOAD ──
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'image/jpeg',
      'image/png',
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`File type not allowed: ${file.mimetype}`));
    }
  },
});

// ── BREVO EMAIL FUNCTION ──
async function sendBrevoEmail({ to, toName, subject, htmlContent, attachments }) {
  return new Promise((resolve, reject) => {
    const emailBody = {
      sender: {
        name: 'BossGiddy CostGuard',
        email: process.env.BREVO_SENDER_EMAIL || 'procurement.bossgiddycostguard@gmail.com'
      },
      to: [{ email: to, name: toName || to }],
      subject,
      htmlContent,
    };
    // Only add attachment key if there are actual attachments
    if (attachments && attachments.length > 0) {
      emailBody.attachment = attachments;
    }
    const payload = JSON.stringify(emailBody);

    const options = {
      hostname: 'api.brevo.com',
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
        'content-type': 'application/json',
        'content-length': Buffer.byteLength(payload)
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(JSON.parse(data));
        } else {
          reject(new Error(`Brevo API error ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// ── HELPER: Build HTML email body ──
function buildEmailHTML(data, ref) {
  const rows = (data.lineItems || [])
    .filter(r => r.description)
    .map((r, i) => `
      <tr style="background:${i % 2 === 0 ? '#f9f9f9' : '#ffffff'}">
        <td style="padding:8px 12px;border:1px solid #e0e0e0;">${i + 1}</td>
        <td style="padding:8px 12px;border:1px solid #e0e0e0;">${r.description || '—'}</td>
        <td style="padding:8px 12px;border:1px solid #e0e0e0;">${r.qty || '—'}</td>
        <td style="padding:8px 12px;border:1px solid #e0e0e0;">${r.unit || '—'}</td>
        <td style="padding:8px 12px;border:1px solid #e0e0e0;">${r.brand || '—'}</td>
        <td style="padding:8px 12px;border:1px solid #e0e0e0;">${r.price || '—'}</td>
        <td style="padding:8px 12px;border:1px solid #e0e0e0;font-weight:bold;color:#D4A017;">${r.total || '—'}</td>
      </tr>`)
    .join('');

  return `
  <!DOCTYPE html>
  <html>
  <head><meta charset="UTF-8"/></head>
  <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f4;">
    <div style="max-width:700px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
      <div style="background:linear-gradient(135deg,#0F0A1E,#1E1640);padding:30px 36px;">
        <div style="font-size:22px;font-weight:900;color:#ffffff;">Cost<span style="color:#D4A017;">Guard</span></div>
        <div style="font-size:11px;color:#9B87C0;letter-spacing:2px;margin-top:4px;">BOSSGIDDY · SUPPLIER QUOTATION PORTAL</div>
        <div style="margin-top:16px;display:inline-block;background:rgba(212,160,23,0.15);border:1px solid rgba(212,160,23,0.4);border-radius:100px;padding:5px 16px;font-size:11px;font-weight:700;color:#D4A017;letter-spacing:1px;">
          REF: ${ref}
        </div>
      </div>
      <div style="padding:32px 36px;">
        <h2 style="font-size:13px;font-weight:800;color:#D4A017;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">01 — Supplier Information</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;width:35%;">Company Name</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;font-weight:600;color:#111;">${data.company || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">Contact Person</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.contact || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">Email</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.email || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">WhatsApp / Phone</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.phone || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">CAC / RC Number</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.cac || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">State</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.state || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">Website</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.website || '—'}</td></tr>
        </table>

        <h2 style="font-size:13px;font-weight:800;color:#D4A017;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">02 — Quotation Details</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;width:35%;">Category</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;font-weight:600;color:#111;">${data.category || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">Valid Until</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.validUntil || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">Currency</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.currency || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">Payment Terms</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.payment || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">Lead Time</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.leadtime || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">Coverage</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.coverage || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">MOQ</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.moq || '—'}</td></tr>
        </table>

        <h2 style="font-size:13px;font-weight:800;color:#D4A017;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">03 — Material Price List</h2>
        ${rows ? `
        <table style="width:100%;border-collapse:collapse;margin-bottom:28px;font-size:12px;">
          <thead>
            <tr style="background:#0F0A1E;">
              <th style="padding:9px 12px;border:1px solid #333;color:#D4A017;text-align:left;">#</th>
              <th style="padding:9px 12px;border:1px solid #333;color:#D4A017;text-align:left;">Description</th>
              <th style="padding:9px 12px;border:1px solid #333;color:#D4A017;text-align:left;">Qty</th>
              <th style="padding:9px 12px;border:1px solid #333;color:#D4A017;text-align:left;">Unit</th>
              <th style="padding:9px 12px;border:1px solid #333;color:#D4A017;text-align:left;">Brand</th>
              <th style="padding:9px 12px;border:1px solid #333;color:#D4A017;text-align:left;">Unit Price</th>
              <th style="padding:9px 12px;border:1px solid #333;color:#D4A017;text-align:left;">Total</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>` : '<p style="color:#999;font-size:13px;margin-bottom:28px;">No line items submitted.</p>'}

        <h2 style="font-size:13px;font-weight:800;color:#D4A017;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">04 — Additional Information</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;width:35%;">Brands Stocked</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.brands || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">Referral</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.referral || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;vertical-align:top;">Notes</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;white-space:pre-wrap;">${data.notes || '—'}</td></tr>
        </table>
      </div>
      <div style="background:#0F0A1E;padding:20px 36px;text-align:center;">
        <div style="font-size:11px;color:#9B87C0;">BossGiddy CostGuard Intelligence Suite · Supplier Quotation Portal</div>
        <div style="font-size:10px;color:#4B3F6B;margin-top:4px;">Auto-generated email. Contact the supplier via details above.</div>
      </div>
    </div>
  </body>
  </html>`;
}

// ── HELPER: Supplier confirmation email ──
function buildConfirmationHTML(data, ref) {
  return `
  <!DOCTYPE html>
  <html>
  <body style="margin:0;padding:0;font-family:'Segoe UI',Arial,sans-serif;background:#f4f4f4;">
    <div style="max-width:600px;margin:30px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
      <div style="background:linear-gradient(135deg,#0F0A1E,#1E1640);padding:36px;text-align:center;">
        <div style="font-size:48px;">✅</div>
        <div style="font-size:24px;font-weight:900;color:#ffffff;margin-top:12px;">Cost<span style="color:#D4A017;">Guard</span></div>
        <div style="font-size:11px;color:#9B87C0;letter-spacing:2px;margin-top:4px;">QUOTATION RECEIVED</div>
      </div>
      <div style="padding:36px;">
        <p style="font-size:15px;color:#333;">Dear <strong>${data.contact || 'Supplier'}</strong>,</p>
        <p style="font-size:14px;color:#555;line-height:1.7;">Thank you for submitting your quotation to <strong>BossGiddy CostGuard</strong>. Our team will review it within <strong style="color:#D4A017;">24 business hours</strong>.</p>
        <div style="background:#f9f6ff;border:1px solid rgba(212,160,23,0.3);border-radius:10px;padding:18px 24px;margin:24px 0;text-align:center;">
          <div style="font-size:11px;color:#9B87C0;letter-spacing:1.5px;margin-bottom:6px;">YOUR REFERENCE NUMBER</div>
          <div style="font-size:20px;font-weight:900;color:#D4A017;">${ref}</div>
        </div>
        <p style="font-size:13px;color:#555;line-height:1.7;">Questions? Contact us:</p>
        <ul style="font-size:13px;color:#555;line-height:2;">
          <li>📧 <a href="mailto:support.bossgiddycostguard@gmail.com" style="color:#D4A017;">support.bossgiddycostguard@gmail.com</a></li>
          <li>💬 <a href="https://wa.me/2348162513797" style="color:#D4A017;">+2348162513797</a></li>
        </ul>
      </div>
      <div style="background:#0F0A1E;padding:18px 36px;text-align:center;">
        <div style="font-size:11px;color:#9B87C0;">© 2026 BossGiddy CostGuard · 🇳🇬 Made for Nigeria</div>
      </div>
    </div>
  </body>
  </html>`;
}

// ── SUBMIT ROUTE ──
app.post('/api/submit', upload.array('files', 10), async (req, res) => {
  try {
    const data = JSON.parse(req.body.formData);
    const ref = data.ref || ('CG-2026-' + Math.random().toString(36).substring(2, 6).toUpperCase());

    // Build attachments for Brevo (base64) — only if files were uploaded
    const attachments = (req.files || [])
      .filter(file => file.buffer && file.buffer.length > 0)
      .map(file => ({
        name: file.originalname,
        content: file.buffer.toString('base64')
      }));

    // Email 1: to procurement inbox
    await sendBrevoEmail({
      to: 'procurement.bossgiddycostguard@gmail.com',
      toName: 'BossGiddy Procurement',
      subject: `📋 New Supplier Quotation — ${data.company || 'Unknown'} [${ref}]`,
      htmlContent: buildEmailHTML(data, ref),
      attachments: attachments.length > 0 ? attachments : undefined
    });

    // Email 2: confirmation to supplier
    if (data.email) {
      await sendBrevoEmail({
        to: data.email,
        toName: data.contact || 'Supplier',
        subject: `✅ Quotation Received — Ref ${ref} | BossGiddy CostGuard`,
        htmlContent: buildConfirmationHTML(data, ref),
        attachments: []
      });
    }

    res.json({ success: true, ref });

  } catch (err) {
    console.error('Submit error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── HEALTH CHECK ──
app.get('/health', (req, res) => res.json({ status: 'ok', time: new Date() }));

// ── START ──
app.listen(PORT, () => console.log(`✅ CostGuard backend running on port ${PORT}`));

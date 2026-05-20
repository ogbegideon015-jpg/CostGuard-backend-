const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARE ──
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ── FILE UPLOAD (memory storage — files sent directly as email attachments) ──
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB per file
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

// ── NODEMAILER TRANSPORTER (Gmail) ──
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER,       // your Gmail address
    pass: process.env.GMAIL_APP_PASS,   // Gmail App Password (not your login password)
  },
});

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

      <!-- Header -->
      <div style="background:linear-gradient(135deg,#0F0A1E,#1E1640);padding:30px 36px;">
        <div style="font-size:22px;font-weight:900;color:#ffffff;">Cost<span style="color:#D4A017;">Guard</span></div>
        <div style="font-size:11px;color:#9B87C0;letter-spacing:2px;margin-top:4px;">BOSSGIDDY · SUPPLIER QUOTATION PORTAL</div>
        <div style="margin-top:16px;display:inline-block;background:rgba(212,160,23,0.15);border:1px solid rgba(212,160,23,0.4);border-radius:100px;padding:5px 16px;font-size:11px;font-weight:700;color:#D4A017;letter-spacing:1px;">
          REF: ${ref}
        </div>
      </div>

      <!-- Body -->
      <div style="padding:32px 36px;">

        <!-- Section 1: Supplier Info -->
        <h2 style="font-size:13px;font-weight:800;color:#D4A017;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">01 — Supplier Information</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;width:35%;">Company / Business Name</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;font-weight:600;color:#111;">${data.company || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">Contact Person</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;font-weight:600;color:#111;">${data.contact || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">Email Address</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.email || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">WhatsApp / Phone</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.phone || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">CAC / RC Number</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.cac || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">State / Location</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.state || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">Website / Social</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.website || '—'}</td></tr>
        </table>

        <!-- Section 2: Quote Details -->
        <h2 style="font-size:13px;font-weight:800;color:#D4A017;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">02 — Quotation Details</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;width:35%;">Material Category</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;font-weight:600;color:#111;">${data.category || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">Quote Valid Until</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.validUntil || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">Currency</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.currency || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">Payment Terms</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.payment || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">Delivery Lead Time</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.leadtime || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">Coverage Area</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.coverage || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">MOQ</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.moq || '—'}</td></tr>
        </table>

        <!-- Section 3: Line Items -->
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

        <!-- Section 4: Additional Info -->
        <h2 style="font-size:13px;font-weight:800;color:#D4A017;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">04 — Additional Information</h2>
        <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;width:35%;">Brands Stocked</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.brands || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;">Referral Source</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;">${data.referral || '—'}</td></tr>
          <tr><td style="padding:9px 12px;background:#f9f9f9;border:1px solid #e0e0e0;font-size:12px;color:#666;vertical-align:top;">Notes / Description</td><td style="padding:9px 12px;border:1px solid #e0e0e0;font-size:13px;color:#111;white-space:pre-wrap;">${data.notes || '—'}</td></tr>
        </table>

      </div>

      <!-- Footer -->
      <div style="background:#0F0A1E;padding:20px 36px;text-align:center;">
        <div style="font-size:11px;color:#9B87C0;">BossGiddy CostGuard Intelligence Suite · Supplier Quotation Portal</div>
        <div style="font-size:10px;color:#4B3F6B;margin-top:4px;">This email was auto-generated. Do not reply directly — contact the supplier via the details above.</div>
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
        <p style="font-size:14px;color:#555;line-height:1.7;">Thank you for submitting your quotation to the <strong>BossGiddy CostGuard Supplier Portal</strong>. We have received your submission and our team will review it within <strong style="color:#D4A017;">24 business hours</strong>.</p>
        <div style="background:#f9f6ff;border:1px solid rgba(212,160,23,0.3);border-radius:10px;padding:18px 24px;margin:24px 0;text-align:center;">
          <div style="font-size:11px;color:#9B87C0;letter-spacing:1.5px;margin-bottom:6px;">YOUR REFERENCE NUMBER</div>
          <div style="font-size:20px;font-weight:900;color:#D4A017;">${ref}</div>
        </div>
        <p style="font-size:13px;color:#555;line-height:1.7;">Upon approval, your company profile and rates will be listed in the <strong>CostGuard Live Material Rate Database</strong> — visible to verified buyers, QS firms, developers and contractors across Nigeria.</p>
        <p style="font-size:13px;color:#555;line-height:1.7;">If you have any questions, contact us:</p>
        <ul style="font-size:13px;color:#555;line-height:2;">
          <li>📧 Email: <a href="mailto:support.bossgiddycostguard@gmail.com" style="color:#D4A017;">support.bossgiddycostguard@gmail.com</a></li>
          <li>💬 WhatsApp: <a href="https://wa.me/2348162513797" style="color:#D4A017;">+2348162513797</a></li>
        </ul>
      </div>
      <div style="background:#0F0A1E;padding:18px 36px;text-align:center;">
        <div style="font-size:11px;color:#9B87C0;">© 2026 BossGiddy CostGuard Intelligence Suite · 🇳🇬 Made for Nigeria</div>
      </div>
    </div>
  </body>
  </html>`;
}

// ── SUBMIT ROUTE ──
app.post('/api/submit', upload.array('files', 10), async (req, res) => {
  try {
    const data = JSON.parse(req.body.formData);
    const ref  = data.ref || ('CG-2026-' + Math.random().toString(36).substring(2, 6).toUpperCase());

    // Build attachments from uploaded files
    const attachments = (req.files || []).map(file => ({
      filename: file.originalname,
      content:  file.buffer,
      contentType: file.mimetype,
    }));

    // ── Email 1: to procurement inbox ──
    await transporter.sendMail({
      from:        `"CostGuard Portal" <${process.env.GMAIL_USER}>`,
      to:          'procurement.bossgiddycostguard@gmail.com',
      subject:     `📋 New Supplier Quotation — ${data.company || 'Unknown'} [${ref}]`,
      html:        buildEmailHTML(data, ref),
      attachments,
      replyTo:     data.email || '',
    });

    // ── Email 2: confirmation to supplier ──
    if (data.email) {
      await transporter.sendMail({
        from:    `"BossGiddy CostGuard" <${process.env.GMAIL_USER}>`,
        to:      data.email,
        subject: `✅ Quotation Received — Ref ${ref} | BossGiddy CostGuard`,
        html:    buildConfirmationHTML(data, ref),
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

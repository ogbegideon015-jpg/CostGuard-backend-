# BossGiddy CostGuard — Supplier Portal Backend
## Setup & Deployment Guide

---

## 📁 What's in This Package

```
costguard-backend/
├── server.js          ← The Node.js backend (handles form + email + file)
├── package.json       ← Dependencies
├── .env.example       ← Environment variables template
├── .gitignore         ← Keeps secrets off GitHub
└── README.md          ← This file

costguard-supplier-portal.html  ← Your frontend (put in public/ folder or host separately)
```

---

## ⚙️ STEP 1 — Install Node.js

Download and install Node.js (v18 or higher):
👉 https://nodejs.org

Check it's installed:
```bash
node --version   # should say v18+ 
npm --version
```

---

## 🔑 STEP 2 — Get Your Gmail App Password

Your backend sends emails via Gmail. You need an **App Password** (not your normal Gmail password).

1. Go to your Google Account: https://myaccount.google.com
2. Click **Security** in the left menu
3. Under "How you sign in to Google", click **2-Step Verification** and enable it
4. Go back to Security → scroll down → click **App passwords**
5. Select app: **Mail** | Device: **Other** → type "CostGuard" → click **Generate**
6. Copy the 16-character password (e.g. `abcd efgh ijkl mnop`)

---

## 🛠️ STEP 3 — Configure the Backend

1. Copy the example env file:
```bash
cp .env.example .env
```

2. Open `.env` and fill in your values:
```
GMAIL_USER=procurement.bossgiddycostguard@gmail.com
GMAIL_APP_PASS=abcdefghijklmnop     ← your 16-char app password (no spaces)
PORT=3000
```

---

## 📦 STEP 4 — Install Dependencies

In the `costguard-backend/` folder, run:
```bash
npm install
```

---

## ▶️ STEP 5 — Run Locally (Test First)

```bash
npm start
```

You should see:
```
✅ CostGuard backend running on port 3000
```

Open your browser → http://localhost:3000/health
You should see: `{"status":"ok"}`

Now open `costguard-supplier-portal.html` in your browser, fill the form and submit.
Check your `procurement.bossgiddycostguard@gmail.com` inbox — the email should arrive! ✅

---

## 🌐 STEP 6 — Deploy to the Internet (Render — Free)

Once local testing works, deploy so real suppliers can access it.

### Option A: Render (Recommended — Free tier available)

1. Create a free account at https://render.com
2. Click **New → Web Service**
3. Connect your GitHub repo (upload the backend folder first)
4. Settings:
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Environment:** Node
5. Add Environment Variables in Render dashboard:
   - `GMAIL_USER` = `procurement.bossgiddycostguard@gmail.com`
   - `GMAIL_APP_PASS` = your app password
6. Deploy → Render gives you a URL like: `https://costguard-backend.onrender.com`

### Option B: Railway (Also free tier)
1. Go to https://railway.app
2. New Project → Deploy from GitHub
3. Add the same environment variables
4. Deploy

---

## 🔗 STEP 7 — Update the HTML Frontend

Once deployed, open `costguard-supplier-portal.html` and find this line near the bottom:

```javascript
const BACKEND_URL = 'http://localhost:3000';
```

Change it to your deployed URL:
```javascript
const BACKEND_URL = 'https://costguard-backend.onrender.com';
```

Then upload the updated HTML to your website hosting.

---

## 📧 What Happens When a Supplier Submits

1. Supplier fills form + uploads file (PDF/DOCX/XLSX/image)
2. Form data + file sent to your Node.js server
3. Server sends **2 emails**:
   - 📬 **To you** (`procurement.bossgiddycostguard@gmail.com`): Full quotation details in a branded HTML email with the uploaded file as an attachment
   - ✅ **To the supplier**: A confirmation email with their reference number
4. Supplier sees the success modal ✅

---

## 🐛 Troubleshooting

| Problem | Fix |
|---|---|
| "Invalid login" error | Make sure you're using App Password, not your Gmail password |
| "Less secure app" error | Enable 2-Step Verification first, then create App Password |
| File not received | Check file is under 10MB and is PDF/DOCX/XLSX/image |
| CORS error in browser | Make sure BACKEND_URL in HTML matches your server URL exactly |
| Render app sleeps | Free tier sleeps after 15min inactivity — upgrade to paid or use Railway |

---

## 📞 Support

- Email: support.bossgiddycostguard@gmail.com
- WhatsApp: +2348162513797

const express = require("express");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const cors = require("cors");

const app = express();

app.use(express.json());
app.use(cors());

// 🔐 einfache Token-Speicherung (später DB möglich)
let resetTokens = {};

// 📧 Gmail Setup (Render ENV)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASS
  }
});

// -------------------------
// 🔥 RESET ANFORDERN
// -------------------------
app.post("/request-reset", (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: "Email fehlt" });
  }

  const token = crypto.randomBytes(32).toString("hex");

  // Token 10 Minuten gültig
  resetTokens[token] = Date.now() + 10 * 60 * 1000;

  const resetLink = `https://github.com/Kalirusi5511/pin-links-frontend/reset.html?token=${token}`;

  transporter.sendMail({
    from: process.env.EMAIL,
    to: email,
    subject: "PIN Reset Link",
    text: `Klicke hier um deinen PIN zurückzusetzen: ${resetLink}`
  });

  res.json({ success: true, message: "Mail gesendet" });
});

// -------------------------
// 🔁 PIN RESET
// -------------------------
app.post("/reset-pin", (req, res) => {
  const { token, newPin } = req.body;

  if (!token || !newPin) {
    return res.status(400).json({ error: "Fehlende Daten" });
  }

  if (!resetTokens[token]) {
    return res.status(400).json({ error: "Ungültiger Token" });
  }

  if (resetTokens[token] < Date.now()) {
    delete resetTokens[token];
    return res.status(400).json({ error: "Token abgelaufen" });
  }

  delete resetTokens[token];

  // 👉 HIER würdest du später DB speichern
  console.log("NEUER PIN:", newPin);

  res.json({ success: true, message: "PIN geändert" });
});

// -------------------------
// 🧪 TEST MAIL (zum prüfen)
// -------------------------
app.get("/test-mail", async (req, res) => {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL,
      to: process.env.EMAIL,
      subject: "Test Mail Render",
      text: "Wenn du das liest, funktioniert dein Mail-System!"
    });

    res.send("Mail gesendet");
  } catch (err) {
    console.error(err);
    res.status(500).send("Fehler beim Mail senden");
  }
});

// -------------------------
// 🚀 SERVER START
// -------------------------
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log("Server läuft auf Port", PORT);
});

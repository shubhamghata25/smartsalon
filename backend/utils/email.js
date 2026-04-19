const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const sendBookingConfirmation = async ({ to, name, service, date, time, bookingRef, amount }) => {
  await transporter.sendMail({
    from: `"SmartSalon" <${process.env.SMTP_USER}>`,
    to,
    subject: `Booking Confirmed — ${bookingRef}`,
    html: `
      <div style="font-family:Georgia,serif;max-width:600px;margin:auto;background:#1a1a1a;color:#F5F0E8;padding:40px;border-top:3px solid #C9A84C">
        <h1 style="font-size:28px;color:#C9A84C;letter-spacing:4px">SMARTSALON</h1>
        <p style="font-size:18px;margin-top:24px">Dear ${name},</p>
        <p>Your appointment has been <strong style="color:#C9A84C">confirmed</strong>.</p>
        <table style="width:100%;margin:24px 0;border-collapse:collapse">
          <tr><td style="padding:10px;border-bottom:1px solid #333;color:#9B8B7A">Reference</td><td style="padding:10px;border-bottom:1px solid #333;color:#C9A84C;font-weight:bold">${bookingRef}</td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #333;color:#9B8B7A">Service</td><td style="padding:10px;border-bottom:1px solid #333">${service}</td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #333;color:#9B8B7A">Date</td><td style="padding:10px;border-bottom:1px solid #333">${date}</td></tr>
          <tr><td style="padding:10px;border-bottom:1px solid #333;color:#9B8B7A">Time</td><td style="padding:10px;border-bottom:1px solid #333">${time}</td></tr>
          <tr><td style="padding:10px;color:#9B8B7A">Amount</td><td style="padding:10px;color:#C9A84C">₹${amount}</td></tr>
        </table>
        <p style="color:#9B8B7A;font-size:13px">Please arrive 5 minutes early. To cancel or reschedule, log in to your account.</p>
        <p style="margin-top:32px;color:#C9A84C;letter-spacing:2px;font-size:12px">SMARTSALON — WHERE STYLE MEETS CRAFT</p>
      </div>`,
  });
};

const sendOwnerAlert = async ({ name, service, date, time, phone, bookingRef }) => {
  await transporter.sendMail({
    from: `"SmartSalon Bot" <${process.env.SMTP_USER}>`,
    to: process.env.OWNER_EMAIL,
    subject: `New Booking: ${bookingRef} — ${service}`,
    html: `<div style="font-family:sans-serif;padding:20px">
      <h2>New Booking Alert</h2>
      <p><b>Ref:</b> ${bookingRef}</p>
      <p><b>Customer:</b> ${name} (${phone})</p>
      <p><b>Service:</b> ${service}</p>
      <p><b>Date/Time:</b> ${date} at ${time}</p>
    </div>`,
  });
};

const sendReminderEmail = async ({ to, name, service, date, time }) => {
  await transporter.sendMail({
    from: `"SmartSalon" <${process.env.SMTP_USER}>`,
    to,
    subject: `Reminder: Your appointment tomorrow`,
    html: `<div style="font-family:Georgia,serif;max-width:600px;margin:auto;background:#1a1a1a;color:#F5F0E8;padding:40px;border-top:3px solid #C9A84C">
      <h2 style="color:#C9A84C">Appointment Reminder</h2>
      <p>Hi ${name}, your <strong>${service}</strong> appointment is tomorrow, <strong>${date}</strong> at <strong>${time}</strong>.</p>
      <p style="color:#9B8B7A">We look forward to seeing you!</p>
    </div>`,
  });
};

module.exports = { sendBookingConfirmation, sendOwnerAlert, sendReminderEmail };

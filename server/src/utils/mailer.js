/**
 * Email sending for notifications (FR-06, UC-11).
 *
 * No SMTP server is configured in this project yet, so by default nothing is sent and
 * sendMail() reports { sent: false }. When SMTP is added later, call setTransport() once
 * at start-up with an object that has sendMail({ to, subject, text }) (for example a
 * nodemailer transport). Tests use setTransport() to stub a working and a failing server.
 */
let transport = null;

function setTransport(newTransport) {
  transport = newTransport;
}

async function sendMail({ to, subject, text }) {
  if (!transport) return { sent: false, reason: 'SMTP is not configured' };
  await transport.sendMail({ to, subject, text });
  return { sent: true };
}

module.exports = { sendMail, setTransport };

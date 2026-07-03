const nodemailer = require("nodemailer");

let transporter;

const getMissingConfigKeys = () =>
  ["SMTP_HOST", "SMTP_USER", "SMTP_PASS"].filter((key) => !process.env[key]);

const getTransporter = () => {
  const missingConfigKeys = getMissingConfigKeys();
  if (missingConfigKeys.length > 0) {
    const error = new Error(
      `Email service is not configured. Missing: ${missingConfigKeys.join(", ")}`
    );
    error.code = "EMAIL_CONFIG_MISSING";
    throw error;
  }

  if (!transporter) {
    const port = Number(process.env.SMTP_PORT) || 587;
    const secure =
      process.env.SMTP_SECURE === "true" ||
      (process.env.SMTP_SECURE === undefined && port === 465);

    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port,
      secure,
      tls: {
        rejectUnauthorized: process.env.SMTP_TLS_REJECT_UNAUTHORIZED !== "false",
      },
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
};

const sendMail = (mailOptions) => getTransporter().sendMail(mailOptions);

module.exports = {
  sendMail,
};

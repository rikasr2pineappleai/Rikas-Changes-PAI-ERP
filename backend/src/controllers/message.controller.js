const fs = require("fs");
const { Op } = require("sequelize");
const { User } = require("../models");
const MailService = require("../services/MailService");

const parseIdList = (value) => {
  if (!value) return [];

  try {
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    return Array.isArray(parsed)
      ? parsed.map((id) => Number(id)).filter((id) => Number.isInteger(id) && id > 0)
      : [];
  } catch (error) {
    return [];
  }
};

const escapeHtml = (value) =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const cleanupFiles = (files = []) => {
  files.forEach((file) => {
    if (file.path && fs.existsSync(file.path)) {
      fs.unlink(file.path, () => {});
    }
  });
};

const getSendErrorMessage = (error) => {
  const isProduction = process.env.NODE_ENV === "production";
  const detail = error.message ? ` (${error.message})` : "";

  if (error.code === "EMAIL_CONFIG_MISSING") {
    return error.message;
  }

  if (error.code === "EAUTH") {
    return `Email authentication failed. Please check the SMTP username and app password.${isProduction ? "" : detail}`;
  }

  if (["ECONNECTION", "ETIMEDOUT", "ESOCKET", "ENOTFOUND", "ECONNREFUSED"].includes(error.code)) {
    return `Could not connect to the email server. Please check the SMTP host, port, and network access.${isProduction ? "" : detail}`;
  }

  if (error.code === "EENVELOPE") {
    return `Email recipient/sender setup failed. Please check sender and recipient email addresses.${isProduction ? "" : detail}`;
  }

  if (error.responseCode >= 500) {
    return `The email server rejected the message. Please try again later.${isProduction ? "" : detail}`;
  }

  return isProduction
    ? "Failed to send message."
    : `Failed to send message.${detail}`;
};

exports.sendMessage = async (req, res) => {
  const uploadedFiles = Array.isArray(req.files) ? req.files : [];

  try {
    const sendTo = req.body.sendTo;
    const subject = req.body.subject?.trim();
    const message = req.body.message?.trim();
    const departmentIds = parseIdList(req.body.departmentIds);
    const employeeIds = parseIdList(req.body.employeeIds);

    if (!subject || !message) {
      cleanupFiles(uploadedFiles);
      return res.status(400).json({
        success: false,
        message: "Subject and message are required.",
      });
    }

    if (!["departments", "individuals"].includes(sendTo)) {
      cleanupFiles(uploadedFiles);
      return res.status(400).json({
        success: false,
        message: "Invalid recipient type.",
      });
    }

    if (sendTo === "departments" && departmentIds.length === 0) {
      cleanupFiles(uploadedFiles);
      return res.status(400).json({
        success: false,
        message: "Select at least one department.",
      });
    }

    if (sendTo === "individuals" && employeeIds.length === 0) {
      cleanupFiles(uploadedFiles);
      return res.status(400).json({
        success: false,
        message: "Select at least one employee.",
      });
    }

    const where = {
      status: "active",
      email: { [Op.ne]: null },
    };

    if (sendTo === "departments") {
      where.department_id = { [Op.in]: departmentIds };
    } else {
      where.id = { [Op.in]: employeeIds };
    }

    const recipients = await User.findAll({
      where,
      attributes: ["email"],
      raw: true,
    });
    const recipientEmails = [...new Set(recipients.map((user) => user.email).filter(Boolean))];

    if (recipientEmails.length === 0) {
      cleanupFiles(uploadedFiles);
      return res.status(400).json({
        success: false,
        message: "No email addresses were found for the selected recipients.",
      });
    }

    const senderName = [req.user?.first_name, req.user?.last_name].filter(Boolean).join(" ");
    const senderEmail = req.user?.email || process.env.FROM_EMAIL || process.env.SMTP_USER;
    const senderLabel = senderName || senderEmail;
    const safeMessage = escapeHtml(message).replace(/\n/g, "<br>");
    const safeSender = escapeHtml(senderLabel);
    const attachments = uploadedFiles.map((file) => ({
      filename: file.originalname,
      path: file.path,
      contentType: file.mimetype,
    }));

    console.log("Sending compose message", {
      recipientCount: recipientEmails.length,
      attachmentCount: attachments.length,
      sendTo,
    });

    await MailService.sendMail({
      from: process.env.FROM_EMAIL || process.env.SMTP_USER,
      to: process.env.FROM_EMAIL || process.env.SMTP_USER,
      bcc: recipientEmails,
      replyTo: senderEmail,
      subject,
      text: `${message}\n\nSent by: ${senderLabel}`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.5;">
          <p>${safeMessage}</p>
          <hr>
          <p style="font-size: 12px; color: #666;">
            Sent by: ${safeSender}
          </p>
        </div>
      `,
      attachments,
    });

    cleanupFiles(uploadedFiles);
    return res.status(200).json({
      success: true,
      message: "Message sent successfully.",
    });
  } catch (error) {
    cleanupFiles(uploadedFiles);
    console.error("Send message error:", error);
    const message = getSendErrorMessage(error);
    return res.status(500).json({
      success: false,
      message,
      error: process.env.NODE_ENV === "development" ? error.message : message,
    });
  }
};

const nodemailer = require('nodemailer');

const hasSmtpConfig = () => Boolean(process.env.SMTP_HOST && process.env.SMTP_FROM);

const sendAuthEmail = async ({ to, subject, text, html }) => {
    if (!hasSmtpConfig()) {
        if (process.env.NODE_ENV === 'production') {
            throw new Error('Email delivery is not configured');
        }
        console.info(`[Auth email preview] To: ${to}\n${text}`);
        return false;
    }

    const transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: process.env.SMTP_USER ? {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        } : undefined
    });

    await transport.sendMail({ from: process.env.SMTP_FROM, to, subject, text, html });
    return true;
};

module.exports = { sendAuthEmail, hasSmtpConfig };

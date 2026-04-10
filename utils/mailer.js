const nodemailer = require('nodemailer');

// Persistent pooled SMTP connection for fast email delivery
const transporter = nodemailer.createTransport({
    pool: true,          // Keep connection open & reuse it
    maxConnections: 5,   // Allow multiple parallel sends
    maxMessages: 100,    // Messages per connection
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false  // Faster TLS handshake
    }
});

// Verify transporter on startup for fast first-send
transporter.verify((error) => {
    if (error) {
        console.error('❌ Mailer connection error:', error.message);
    } else {
        console.log('✅ Mailer ready - SMTP connection pooled');
    }
});

const sendEmail = async (to, subject, text, html = null) => {
    try {
        const info = await transporter.sendMail({
            from: `"Smart Campus System" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
            html
        });
        console.log(`✅ Email delivered to ${to} [${info.messageId}]`);
    } catch (error) {
        console.error(`❌ Email failed to ${to}:`, error.message);
    }
};

module.exports = { sendEmail };

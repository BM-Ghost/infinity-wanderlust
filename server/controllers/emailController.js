// server/controllers/emailController.js
const nodemailer = require('nodemailer');
const config = require('../config/config');

const sendVerificationEmail = async (to, subject, text) => {
    let transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: config.email,
            pass: config.password,
        },
    });

    let info = await transporter.sendMail({
        from: `"Your Name" <${config.email}>`,
        to,
        subject,
        text,
    });

    console.log('Message sent: %s', info.messageId);
};

module.exports = { sendVerificationEmail };

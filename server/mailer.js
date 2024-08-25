const nodemailer = require('nodemailer');
const config = require('./config');

const sendVerificationEmail = async (to, subject, text) => {
    console.log('Email:', config.email);
    console.log('Password:', config.password);

    let transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
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

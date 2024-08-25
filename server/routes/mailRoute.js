const express = require('express');
const { sendVerificationEmail } = require('../mailer');
const router = express.Router();
module.exports = router;

router.post('/send-verification-email', async (req, res) => {
    const { email, verificationCode } = req.body;

    if (!email || !verificationCode) {
        return res.status(400).send('Email and verification code are required.');
    }

    try {
        await sendVerificationEmail(
            email,
            'Your Verification Code',
            `Your verification code is: ${verificationCode}`
        );
        res.status(200).send('Verification email sent.');
    } catch (error) {
        console.error('Error sending email:', error);
        res.status(500).send('Failed to send verification email.');
    }
});

module.exports = router;

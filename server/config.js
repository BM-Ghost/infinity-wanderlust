// server/config.js
require('dotenv').config();
console.log(process.env);  // Log the entire process.env object
module.exports = {
    email: process.env.EMAIL_USERNAME,
    password: process.env.EMAIL_PASSWORD,
};



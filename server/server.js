const express = require('express');
const cors = require('cors'); // Import the cors package
const mailerRoutes = require('./routes/mailRoute');

const app = express();
const PORT = process.env.PORT || 5000;

app.options('*', cors()); // Enable preflight for all routes
app.use(cors()); // Use the cors middleware
app.use(express.json());
app.use('/api', mailerRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const PORT = 5000;

app.use(cors());

app.get('/api/travel-articles', (req, res) => {
    const { location } = req.query;

    if (!location) {
        return res.status(400).json({ error: "Location is required" });
    }

    exec(`python3 scraper.py "${location}"`, (error, stdout, stderr) => {
        if (error) {
            return res.status(500).json({ error: "Error fetching articles." });
        }

        res.json(JSON.parse(stdout));
    });
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const PORT = 5000;

app.use(cors());

app.get('/api/travel-articles', (req, res) => {
    console.log("Received query:", req.query);

    const { location } = req.query; 
    if (!location) {
        return res.status(400).json({ error: "Query parameter is required" });
    }

    exec(`python3 scraper.py "${location}"`, (error, stdout, stderr) => {
        if (error) {
            console.error("Execution error:", stderr);
            return res.status(500).json({ error: "Error fetching articles." });
        }

        try {
            const articles = JSON.parse(stdout);
            res.json(articles);
        } catch (parseError) {
            console.error("JSON Parse Error:", parseError);
            return res.status(500).json({ error: "Failed to process articles data." });
        }
    });
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));

// backend/server.js
const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 10001; // Use 10001 for the backend

app.use(cors());

// Define your existing API endpoint
app.get('/api/travel-articles', (req, res) => {
  const { location } = req.query;
  if (!location) {
    return res.status(400).json({ error: "Query parameter 'location' is required." });
  }
  
  // Use exec to call your Python scraper
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
      res.status(500).json({ error: "Failed to process articles data." });
    }
  });
});

// Serve the React frontend for undefined routes
app.use(express.static(path.join(__dirname, '../frontend/build')));

// Handle all other routes and serve the React index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/build/index.html'));
});

// Export the app for Vercel or Render instead of starting the server directly
module.exports = app;

// Only start the server when running locally (for local development)
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

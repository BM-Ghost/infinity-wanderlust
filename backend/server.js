// backend/server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, "../frontend/build")));

// API Route: Travel Articles
app.get("/api/travel-articles", (req, res) => {
  const { location } = req.query;
  if (!location) {
    return res.status(400).json({ error: "Query parameter 'location' is required." });
  }

  // Use exec to call the Python scraper
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

// Serve React app for unknown routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});

// Export the app for deployment
module.exports = app;

// Start the server locally
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}


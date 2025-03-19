const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5000; // Ensure this matches the backend port on Render

app.use(cors());

// Define your API endpoint
app.get('/api/travel-articles', (req, res) => {
  const { location } = req.query;
  if (!location) {
    return res.status(400).json({ error: "Query parameter 'location' is required." });
  }
  
  // Use exec to call your Python scraper
  exec(`python3 scraper.py "${location}"`, (error, stdout, stderr) => {
    if (error) {
      console.error("Execution error:", stderr || error.message);
      return res.status(500).json({ error: "Error fetching articles.", details: stderr || error.message });
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

// Health check route
app.get('/', (req, res) => {
  res.send("Backend API is running...");
});

// Export the app for Vercel or Render instead of starting the server directly
module.exports = app;

// Only start the server when running locally
if (require.main === module) {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

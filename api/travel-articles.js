// api/travel-articles.js
const { exec } = require('child_process');

module.exports = (req, res) => {
  const { location } = req.query;
  if (!location) {
    return res.status(400).json({ error: "Query parameter 'location' is required." });
  }

  // Call the Python script (ensure that 'python3' is available in the environment)
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
};

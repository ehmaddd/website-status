// Use dynamic import for p-limit
(async () => {
  const { default: pLimit } = await import('p-limit');  // Dynamically import the ESM package

  const express = require('express');
  const axios = require('axios');
  const cors = require('cors');
  const path = require('path');

  const app = express();
  app.use(cors()); // Allow cross-origin requests

  app.use(express.static(path.join(__dirname, 'frontend', 'build')));

  // Define the limit of concurrent requests
  const limit = pLimit(5);  // Adjust based on your system's capabilities (5 concurrent requests)

  // Endpoint to check the status of multiple websites
  app.get('/check-websites', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const websites = require('./websites');  // Assuming the websites are in a separate file

    let upCount = 0;
    let downCount = 0;

    // Function to check each website
    const checkWebsite = async (url) => {
      try {
        const response = await axios.get(url, { timeout: 5000 });  // 5 seconds timeout
        upCount++;
        res.write(`data: ${JSON.stringify({ url, status: response.status, statusText: 'Up' })}\n\n`);
      } catch (error) {
        downCount++;
        res.write(`data: ${JSON.stringify({ url, status: error.response ? error.response.status : 0, statusText: 'Down' })}\n\n`);
      }
    };

    // Process all websites with limited concurrency
    const promises = websites.map((url) => limit(() => checkWebsite(url)));
    await Promise.all(promises);  // Wait for all websites to be checked

    // Send final summary after all websites have been checked
    res.write(`data: ${JSON.stringify({ summary: { upCount, downCount } })}\n\n`);
    res.end();
  });

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
    });

  const PORT = 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();

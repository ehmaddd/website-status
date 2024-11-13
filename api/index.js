import pLimit from 'p-limit';
import axios from 'axios';
import websites from './websites';  // Assuming websites is an array of URLs

// Define the limit of concurrent requests
const limit = pLimit(5); // Limit concurrency to 5 requests

export default async (req, res) => {
  // Set headers for Server-Sent Events (SSE)
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  let upCount = 0;
  let downCount = 0;

  // Function to check each website
  const checkWebsite = async (url) => {
    try {
      const response = await axios.get(url, { timeout: 5000 });  // 5-second timeout
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
};

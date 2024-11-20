// Use dynamic import for p-limit
(async () => {
  const { default: pLimit } = await import('p-limit');  // Dynamically import the ESM package

  const express = require('express');
  const nodemailer = require('nodemailer');
  const axios = require('axios');
  const cors = require('cors');

  const app = express();
  app.use(cors()); // Allow cross-origin requests
  app.use(express.json());

  // Define the limit of concurrent requests
  const limit = pLimit(5);  // Adjust based on your system's capabilities (5 concurrent requests)

  const transporter = nodemailer.createTransport({
    service: 'gmail', // Or any other service like SMTP server details
    auth: {
      user: 'your-email@gmail.com', // Replace with your email
      pass: 'your-email-password', // Replace with your email password or an App Password
    },
  });

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

  app.post('/send-emails', async (req, res) => {
    const { emails } = req.body; // Array of email addresses
  
    if (!emails || !Array.isArray(emails)) {
      return res.status(400).send('Invalid email addresses');
    }
  
    const mailOptions = {
      from: 'your-email@gmail.com', // Sender address
      subject: 'Test Email', // Subject line
      text: 'This is a test email sent from the backend.', // Email body
    };
  
    try {
      // Send emails to all addresses in the emails array
      for (const email of emails) {
        mailOptions.to = email; // Set the recipient
  
        // Send the email
        await transporter.sendMail(mailOptions);
      }
      res.status(200).send('Emails sent successfully');
    } catch (error) {
      console.error('Error sending emails:', error);
      res.status(500).send('Error sending emails');
    }
  });

  const PORT = 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();

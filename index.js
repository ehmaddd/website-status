// Use dynamic import for p-limit
(async () => {
  const { default: pLimit } = await import('p-limit');  // Dynamically import the ESM package

  const express = require('express');
  const nodemailer = require('nodemailer');
  const axios = require('axios');
  const cors = require('cors');
  const Imap = require('imap');
  const { simpleParser } = require('mailparser');

  const app = express();
  app.use(cors()); // Allow cross-origin requests
  app.use(express.json());

  // Define the limit of concurrent requests
  const limit = pLimit(5);  // Adjust based on your system's capabilities (5 concurrent requests)

  const transporter = nodemailer.createTransport({
    service: 'Yahoo',
    auth: {
      user: 'ehmaddd@yahoo.com', // Replace with your Yahoo email
      pass: 'qxnswqatonphrerl', // Replace with the App Password you generated in Yahoo
    },
  });

  function fetchEmails(res) {
    const imap = new Imap({
      user: 'ehmaddd@yahoo.com',
      password: 'qxnswqatonphrerl',
      host: 'imap.mail.yahoo.com',
      port: 993,
      tls: true,
      connTimeout: 30000,
      authTimeout: 30000,
    });
  
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-GB', { 
      day: '2-digit', 
      month: 'short', 
      year: 'numeric' 
    }).replace(/ /g, '-'); // Format as DD-MMM-YYYY
  
    imap.once('ready', () => {
      imap.openBox('INBOX', false, (err, box) => {
        if (err) throw err;
  
        // Search for emails received today
        imap.search([['ON', formattedDate]], (err, results) => {
          if (err) {
            res.write(`data: ${JSON.stringify({ error: 'Error fetching emails' })}\n\n`);
            res.end();
            return;
          }
  
          if (!results || results.length === 0) {
            res.write(`data: ${JSON.stringify({ message: 'No emails received today' })}\n\n`);
            res.end();
            return;
          }
  
          const fetcher = imap.fetch(results, { bodies: '' });
          fetcher.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, (err, mail) => {
                if (err) return console.error('Error parsing email:', err);
  
                // Extract the email date
                const emailDate = mail.date ? mail.date.toISOString() : 'Unknown date';
  
                // Send the parsed email data along with the date to the client
                res.write(`data: ${JSON.stringify({ ...mail, receivedDate: emailDate })}\n\n`);
              });
            });
          });
  
          fetcher.once('end', () => {
            res.end(); // End the SSE stream
            imap.end();
          });
        });
      });
    });
  
    imap.once('error', (err) => {
      console.error(err);
      res.write(`data: ${JSON.stringify({ error: 'IMAP connection error' })}\n\n`);
      res.end();
    });
  
    imap.connect();
  }

  // Endpoint to check the status of multiple websites
  app.get('/check-websites', async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    const websites = require('./websites');

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
    const { subject, text, emails } = req.body;

    // Ensure that emails, subject, and text are provided in the request body
    if (!emails || emails.length === 0 || !subject || !text) {
        return res.status(400).send('Please provide to, subject, and text for the email');
    }

    // Create a mailOptions object with the provided subject, text, and emails
    const mailOptions = {
        from: '"Ahmad Saeed" ehmaddd@yahoo.com',
        to: emails.join(', '),      // Join the email addresses in a comma-separated string
        subject: subject,           // Subject of the email
        text: text,                 // Body of the email (text)
    };

    try {
        // Send the email using the transporter object (assumed to be set up previously)
        await transporter.sendMail(mailOptions);

        // Respond with a success message
        res.status(200).send('Emails sent successfully');
    } catch (error) {
        // If an error occurs, log it and send an error response
        console.error('Error sending email:', error);
        res.status(500).send('Error sending email');
    }
  });

  app.get('/fetch-emails', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();
  
    fetchEmails(res); // Call the fetchEmails function
  });

  const PORT = 5000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})();

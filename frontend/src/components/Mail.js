import React, { useState, useEffect } from 'react';
import emails from './emails';
import './Mail.css';
import axios from 'axios';

const Mail = () => {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');
  const [emailAddresses, setEmailAddresses] = useState(emails);
  const [subject, setSubject] = useState('');
  const [text, setText] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [mails, setMails] = useState([]);
  const [retryCount, setRetryCount] = useState(0);
  const [sendTime, setSendTime] = useState(null); // Store the send time
  const [fetchingEmails, setFetchingEmails] = useState(false); // Control when to start fetching emails
  const [matchedEmails, setMatchedEmails] = useState(new Set()); // Track matched emails

  const handleSubjectChange = (event) => {
    setSubject(event.target.value);
  };

  const handleTextChange = (event) => {
    setText(event.target.value);
  };

  const handleEmailChange = (event) => {
    setEmailInput(event.target.value);
  };

  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const addEmail = () => {
    const normalizedEmail = emailInput.trim().toLowerCase();

    if (!isValidEmail(normalizedEmail)) {
      alert('Invalid email address format.');
      return;
    }

    if (emailAddresses.includes(normalizedEmail)) {
      alert('Duplicate email address not allowed.');
      return;
    }

    setEmailAddresses((prevEmails) => [...prevEmails, normalizedEmail]);
    setEmailInput('');
  };

  const removeEmail = (email) => {
    setEmailAddresses((prevEmails) => prevEmails.filter((e) => e !== email));
  };

  const sendEmails = async () => {
    setSending(true);
    setMessage('');
    setSendTime(new Date()); // Record the current time when emails are sent

    try {
      const response = await axios.post('http://localhost:5000/send-emails', {
        emails: emailAddresses,
        subject: subject,
        text: text,
      });
      setMessage(response.data);

      // After emails are sent, start fetching emails
      setFetchingEmails(true); // Now start fetching emails
    } catch (error) {
      setMessage('Error sending emails: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (!fetchingEmails) return; // Don't start fetching emails unless the flag is true
  
    let retryTimeout;
  
    const connectToEventSource = () => {
      console.log('Connecting to EventSource...');
      const eventSource = new EventSource('http://localhost:5000/fetch-emails');
  
      eventSource.onopen = () => {
        console.log('Connected to EventSource');
        setRetryCount(0); // Reset retry count on successful connection
      };
  
      eventSource.onmessage = (event) => {
        try {
          const email = JSON.parse(event.data);
  
          // Extract only the required fields
          const simplifiedEmail = {
            sender: email.from?.text, // e.g., "Ahmed Saeed <ehmaddd@gmail.com>"
            subject: email.subject,
            date: email.date, // Ensure this field exists in your data
          };
  
          console.log(simplifiedEmail);
  
          // Extract the email address from the sender string using regex
          const emailRegex = /<([^>]+)>/;
          const match = simplifiedEmail.sender?.match(emailRegex);
          const senderEmail = match ? match[1].toLowerCase() : ''; // Extracted and lowercased email
  
          // Only update the mails state if the email was received after the send time
          if (sendTime && new Date(email.date) > sendTime) {
            setMails((prevMails) => {
              if (
                !prevMails.some(
                  (mail) =>
                    mail.sender === simplifiedEmail.sender &&
                    mail.subject === simplifiedEmail.subject &&
                    mail.date === simplifiedEmail.date
                )
              ) {
                return [...prevMails, simplifiedEmail];
              }
              return prevMails;
            });
  
            // Check if the extracted sender's email matches any of the email addresses in the list
            if (emailAddresses.includes(senderEmail)) {
              setMatchedEmails((prev) => new Set(prev.add(senderEmail)));
            }
          }
        } catch (error) {
          console.error('Error parsing email data:', error);
        }
      };
  
      eventSource.onerror = (error) => {
        console.error('Error in EventSource:', error);
        eventSource.close();
        setRetryCount((prev) => prev + 1);
  
        // Retry connection after 5 seconds
        retryTimeout = setTimeout(connectToEventSource, 5000);
      };
  
      return eventSource;
    };
  
    const eventSource = connectToEventSource();
  
    return () => {
      console.log('Cleaning up EventSource');
      eventSource.close();
      clearTimeout(retryTimeout);
    };
  }, [fetchingEmails, sendTime, emailAddresses]);

  return (
    <div className="mail-container">
      <div className="form-group">
        <label>
          Subject:
          <input
            type="text"
            value={subject}
            onChange={handleSubjectChange}
            placeholder="Enter subject"
            disabled={sending}
            className="input-field"
          />
        </label>
      </div>

      <div className="form-group">
        <label>
          Message Text:
          <textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Enter message text"
            disabled={sending}
            className="input-field"
          />
        </label>
      </div>

      <div className="form-group">
        <div className="email-list">
          {emailAddresses.length > 0 ? (
            emailAddresses.map((email, index) => (
              <div key={index} className="email-item">
                <span className="email-text">{email}</span>
                <button
                  className="remove-btn"
                  onClick={() => removeEmail(email)}
                  disabled={sending}
                >
                  &times;
                </button>
              </div>
            ))
          ) : (
            <p>No email addresses to send to.</p>
          )}
        </div>
      </div>

      <div className="form-group">
        <input
          type="email"
          value={emailInput}
          onChange={handleEmailChange}
          placeholder="Enter email address"
          disabled={sending}
          className="input-field"
        />
        <button
          className="add-btn"
          onClick={addEmail}
          disabled={sending || !emailInput}
        >
          Add Email
        </button>
      </div>

      <button
        className="send-btn"
        onClick={sendEmails}
        disabled={sending || emailAddresses.length === 0 || !subject || !text}
      >
        {sending ? 'Sending...' : 'Send Emails'}
      </button>

      {message && <p>{message}</p>}
    </div>
  );
};

export default Mail;

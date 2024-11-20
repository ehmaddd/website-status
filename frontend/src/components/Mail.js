import React, { useState } from 'react';
import axios from 'axios';

const Mail = () => {
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState('');

  const emailAddresses = Array.from({ length: 100 }, (_, index) => `email${index + 1}@example.com`);

  const sendEmails = async () => {
    setSending(true);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:5000/send-emails', { emails: emailAddresses });
      setMessage(response.data);
    } catch (error) {
      setMessage('Error sending emails: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div>
      <h2>Mail Sender</h2>
      <button onClick={sendEmails} disabled={sending}>
        {sending ? 'Sending...' : 'Send Emails'}
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default Mail;

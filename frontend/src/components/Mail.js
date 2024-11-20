import React, { useState } from 'react';
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

  const handleSubjectChange = (event) => {
    setSubject(event.target.value);
  };

  const handleTextChange = (event) => {
    setText(event.target.value);
  };

  const handleEmailChange = (event) => {
    setEmailInput(event.target.value);
  };

  const addEmail = () => {
    if (emailInput && !emailAddresses.includes(emailInput)) {
      setEmailAddresses([...emailAddresses, emailInput]);
      setEmailInput('');
    }
  };

  const removeEmail = (email) => {
    setEmailAddresses(emailAddresses.filter((e) => e !== email));
  };

  const sendEmails = async () => {
    setSending(true);
    setMessage('');

    try {
      const response = await axios.post('http://localhost:5000/send-emails', {
        emails: emailAddresses,
        subject: subject,
        text: text
      });
      setMessage(response.data);
    } catch (error) {
      setMessage('Error sending emails: ' + error.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mail-container">

      {/* Form to input subject and text */}
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

      {/* Email Addresses section */}
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

      {/* Input to add new email addresses */}
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

      {/* Send email button */}
      <button
        className="send-btn"
        onClick={sendEmails}
        disabled={sending || emailAddresses.length === 0 || !subject || !text}
      >
        {sending ? 'Sending...' : 'Send Emails'}
      </button>

      {/* Display message or error */}
      {message && <p>{message}</p>}
    </div>
  );
};

export default Mail;

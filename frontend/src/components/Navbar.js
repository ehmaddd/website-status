import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Website status</Link>
        </li>
        <li>
          <Link to="/mail">Send e-mails</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
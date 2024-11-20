import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

function Navbar() {
  return (
    <nav>
      <ul>
        <li>
          <Link to="/">Status</Link>
        </li>
        <li>
          <Link to="/mail">Mail</Link>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
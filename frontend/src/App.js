import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Mail from './components/Mail';
import Status from './components/Status';
import Navbar from './components/Navbar';
import './App.css';

function App() {
    return (
      <Router>
        <Navbar />
  
        <Routes>
          <Route path="/" element={<Status />} />
          <Route path="/mail" element={<Mail />} />
        </Routes>
      </Router>
    );
  }

export default App;

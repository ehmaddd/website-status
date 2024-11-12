import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [upCount, setUpCount] = useState(0);
  const [downCount, setDownCount] = useState(0);

  useEffect(() => {
    const eventSource = new EventSource('http://localhost:5000/check-websites');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.summary) {
        setUpCount(data.summary.upCount);
        setDownCount(data.summary.downCount);
      } else {
        setStatusData((prevData) => [...prevData, data]);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  const checkWebsites = () => {
    setStatusData([]);
    setUpCount(0);
    setDownCount(0);
    setLoading(true);
  };

  return (
    <div className="app">
      <h2>Website Status Checker</h2>
      <button onClick={checkWebsites} disabled={loading} className="check-button">
        {loading ? "Checking..." : "Check Status"}
      </button>

      <div className="status-grid">
        {statusData.map((site, index) => (
          <div key={index} className={`status-card ${site.statusText === 'Up' ? 'status-up' : 'status-down'}`}>
            <h4>{site.url}</h4>
            <p>Status: {site.status} ({site.statusText})</p>
          </div>
        ))}
      </div>

      <div className="summary">
        <h3>Summary:</h3>
        <p className="up-count">UP websites: {upCount}</p>
        <p className="down-count">DOWN websites: {downCount}</p>
      </div>
    </div>
  );
}

export default App;

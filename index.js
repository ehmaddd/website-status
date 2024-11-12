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
        setLoading(false);
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

      <table className="status-table">
        <thead>
          <tr>
            <th>Website URL</th>
            <th>Status</th>
            <th>HTTP Code</th>
          </tr>
        </thead>
        <tbody>
          {statusData.map((site, index) => (
            <tr key={index} className={site.statusText === "Up" ? "status-up" : "status-down"}>
              <td>{site.url}</td>
              <td>{site.statusText}</td>
              <td>{site.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="summary">
        <h3>Summary</h3>
        <p>UP websites: <span className="up-count">{upCount}</span></p>
        <p>DOWN websites: <span className="down-count">{downCount}</span></p>
      </div>
    </div>
  );
}

export default App;

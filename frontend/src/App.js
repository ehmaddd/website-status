import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [upCount, setUpCount] = useState(0);
  const [downCount, setDownCount] = useState(0);

  // Function to update status and add timestamp
  const check = () => {
    checkWebsites();
    const eventSource = new EventSource('http://localhost:5000/check-websites');
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.summary) {
        // When summary data is received, update the final counts
        setUpCount(data.summary.upCount);
        setDownCount(data.summary.downCount);
      } else {
        // Add timestamp to each website status data
        const updatedData = { 
          ...data, 
          checkedAt: new Date().toLocaleString()  // Store the current date/time
        };

        // For each website, update the status data
        setStatusData((prevData) => [...prevData, updatedData]);

        // Update the counts continuously as websites are checked
        if (data.statusText === 'Up') {
          setUpCount((prevCount) => prevCount + 1);
        } else if (data.statusText === 'Down') {
          setDownCount((prevCount) => prevCount + 1);
        }
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource failed:', error);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  };

  // Function to reset the state before checking websites
  const checkWebsites = () => {
    setStatusData([]);
    setUpCount(0);
    setDownCount(0);
    setLoading(true);
  };

  // Automatically check websites every 5 minutes
  useEffect(() => {
    const intervalId = setInterval(() => {
      check();  // Trigger website check every 5 minutes
    }, 300000);  // 300000 ms = 5 minutes

    // Clean up the interval when component unmounts
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="main">
      <header>
        <h2>Website Status Checker</h2>
        <div className="summary">
          <div className="left">
            <p className="up-count">UP websites: {upCount}</p>
          </div>
          <button onClick={check}>Check</button>
          <div className="right">
            <p className="down-count">DOWN websites: {downCount}</p>
          </div>
        </div>
      </header>

      <div className="status-grid">
        {statusData.map((site, index) => (
          <div 
            key={index} 
            className={`status-card ${site.statusText === 'Up' ? 'status-up' : 'status-down'}`}
          >
            <h4 className={`${site.status === 200 ? 'site-up' : 'site-down'}`}><a href={site.url} target='_BLANK'>{site.url}</a></h4>
            <p className={`status ${site.status === 200 ? 'status-up' : 'status-down'}`}>
              Status: {site.status} ({site.statusText})
            </p>
            <p className="checked-at">Checked at: {site.checkedAt}</p> {/* Display the timestamp */}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';

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
    <div className="App">
      <h2>Website Status Checker</h2>
      <button onClick={checkWebsites} disabled={loading}>
        {loading ? "Checking..." : "Check Status"}
      </button>

      <ul>
        {statusData.map((site, index) => (
          <li key={index} style={{ color: site.statusText === "Up" ? "green" : "red" }}>
            {site.url} - Status: {site.status} ({site.statusText})
          </li>
        ))}
      </ul>

      <div>
        <h3>Summary:</h3>
        <p>UP websites: {upCount}</p>
        <p>DOWN websites: {downCount}</p>
      </div>
    </div>
  );
}

export default App;

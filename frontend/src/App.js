import React, { useState, useEffect } from 'react';
import './App.css';

function App() {
  const [statusData, setStatusData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [upCount, setUpCount] = useState(0);
  const [downCount, setDownCount] = useState(0);
  const [timer, setTimer] = useState(null);

  const check = () => {
    checkWebsites();
    const eventSource = new EventSource(`/check-websites`);
    
    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.summary) {
        setUpCount(data.summary.upCount);
        setDownCount(data.summary.downCount);
      } else {
        setStatusData((prevData) => [...prevData, data]);

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

  const checkWebsites = () => {
    setStatusData([]);
    setUpCount(0);
    setDownCount(0);
    setLoading(true);
  };

    // Timer logic
    useEffect(() => {
      if (timer === null) return;
    
      const intervalId = setInterval(() => {
        setTimer((prev) => {
          if (prev === 1) {
            clearInterval(intervalId);
            check();
            return 300;
          }
          return prev - 1;
        });
      }, 1000);
    
      return () => clearInterval(intervalId);
    }, [timer]);
    
    const formatTime = (time) => {
      const minutes = String(Math.floor(time / 60)).padStart(2, '0');
      const seconds = String(time % 60).padStart(2, '0');
      return `${minutes}:${seconds}`;
    };

    const handleCheckClick = () => {
      setTimer(300);
      check();
    };

  return (
    <div className="main">
      <header>
        <h2>Website Status Checker</h2>
        <div className="timer">
          {timer !== null ? formatTime(timer) : '00:00'}
        </div>
        <div className="summary">
          <div className="left">
            <p className="up-count">UP websites: {upCount}</p>
          </div>
          <button className="check-button" onClick={handleCheckClick}>C H E C K</button>
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
            <h4 className={`${site.status === 200 ? 'site-up' : 'site-down'}`}>
              <a href={site.url} target='_BLANK' rel="noreferrer">{site.url}</a>
            </h4>
            <div>
              <p className={`status ${site.status === 200 ? 'status-up' : 'status-down'}`}>
                Status: {site.status} ({site.statusText})
              </p>
              <p className="checked-at">{site.checkedAt}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;

import React, { useState, useEffect } from 'react';
        import io, { Socket } from 'socket.io-client';
        import './App.css'; // Assuming some general styles might still be in App.css

        const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL || 'http://localhost:3000';

        const ClickTracker: React.FC = () => {
          const [socket, setSocket] = useState<Socket | null>(null);
          const [clickCount, setClickCount] = useState<number>(0);
          const [isConnected, setIsConnected] = useState<boolean>(false);

          useEffect(() => {
            const newSocket = io(SOCKET_SERVER_URL);
            setSocket(newSocket);

            newSocket.on('connect', () => {
              setIsConnected(true);
              console.log('Connected to server');
              // Optional: Request initial count from server if needed
              // newSocket.emit('getInitialCount');
            });

            newSocket.on('disconnect', () => {
              setIsConnected(false);
              console.log('Disconnected from server');
            });

            newSocket.on('updateCount', (newCount: number) => {
              setClickCount(newCount);
            });

            newSocket.on('connect_error', (err) => {
              console.error('Connection Error:', err);
              alert(`Failed to connect to the server at ${SOCKET_SERVER_URL}. Error: ${err.message}. Please ensure the server is running and accessible.`);
            });

            return () => {
              newSocket.off('connect');
              newSocket.off('disconnect');
              newSocket.off('updateCount');
              newSocket.off('connect_error');
              newSocket.disconnect();
            };
          }, []);

          const handleButtonClick = () => {
            if (socket && isConnected) {
              socket.emit('buttonClicked');
            } else {
              alert("Not connected to the server. Please wait or try refreshing.");
            }
          };

          return (
            <div className="click-tracker-container">
              <h1>Real-Time Click Tracker</h1>
              <p className="connection-status">
                Status: {isConnected ? <span style={{color: 'green'}}>Connected</span> : <span style={{color: 'red'}}>Disconnected</span>}
              </p>
              <div className="click-area">
                <button onClick={handleButtonClick} disabled={!isConnected}>
                  Click Me!
                </button>
                <p className="click-count">Total Clicks: {clickCount}</p>
              </div>
            </div>
          );
        };

        export default ClickTracker;

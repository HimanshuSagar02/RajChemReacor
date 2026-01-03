import React, { useState, useEffect } from 'react';
import { FaWifi, FaWifiSlash } from 'react-icons/fa';
import axios from 'axios';

const getServerUrl = () => {
  return import.meta.env.VITE_SERVER_URL || 
    (import.meta.env.MODE === 'production' 
      ? "https://rajchemreactor.onrender.com" 
      : "http://localhost:8000");
};

const checkServerConnection = async () => {
  try {
    const response = await axios.get(`${getServerUrl()}/`, { 
      timeout: 5000,
      withCredentials: true 
    });
    return { connected: true, message: 'Server is reachable' };
  } catch (error) {
    if (!error.response) {
      return { 
        connected: false, 
        message: 'Cannot connect to server. Please check your internet connection and server status.',
        error: error.message 
      };
    }
    return { connected: true, message: 'Server is reachable (error response received)' };
  }
};

function ConnectionStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [serverConnected, setServerConnected] = useState(null);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    // Monitor browser online/offline status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check server connection periodically
    const checkConnection = async () => {
      if (isOnline) {
        setChecking(true);
        const result = await checkServerConnection();
        setServerConnected(result.connected);
        setChecking(false);
      } else {
        setServerConnected(false);
      }
    };

    // Initial check
    checkConnection();

    // Check every 30 seconds
    const interval = setInterval(checkConnection, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [isOnline]);

  // Don't show if everything is connected
  if (isOnline && serverConnected !== false) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 animate-pulse">
      {!isOnline ? (
        <>
          <FaWifiSlash className="text-xl" />
          <span className="text-sm font-semibold">No Internet Connection</span>
        </>
      ) : checking ? (
        <>
          <FaWifi className="text-xl animate-spin" />
          <span className="text-sm font-semibold">Checking server...</span>
        </>
      ) : (
        <>
          <FaWifiSlash className="text-xl" />
          <span className="text-sm font-semibold">Cannot connect to server</span>
        </>
      )}
    </div>
  );
}

export default ConnectionStatus;


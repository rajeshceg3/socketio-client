import React, { useState, useEffect } from 'react';
import io, { Socket } from 'socket.io-client';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import './Chat.css'; // Import the CSS file

// Define a type for the message object
export interface Message {
  id?: number; // Optional: ID might be assigned by server or be a timestamp
  text: string;
  sender: string;
  timestamp?: Date; // Optional: server might add this
}

// Assume the server is running on localhost:3001
// IMPORTANT: Replace with your actual server URL if different
const SOCKET_SERVER_URL = process.env.REACT_APP_SOCKET_SERVER_URL || 'http://localhost:3001';


const ChatWindow: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [username, setUsername] = useState<string>(''); // Simple username handling
  const [isConnected, setIsConnected] = useState(false);


  useEffect(() => {
    const user = prompt("Please enter your username to join the chat:", "User" + Math.floor(Math.random() * 1000));
    if (user) {
      setUsername(user);
    } else {
      // Handle case where user cancels prompt - perhaps set a default or prevent chat access
      setUsername("Anonymous" + Math.floor(Math.random() * 1000));
      // Or you could return early / show a message "Username is required to chat"
    }
  }, []);


  useEffect(() => {
    if (!username) return; // Don't connect if username is not set

    const newSocket = io(SOCKET_SERVER_URL, {
      query: { username } // Pass username as a query parameter (optional, depends on server)
    });
    setSocket(newSocket);

    newSocket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to chat server');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from chat server');
    });

    newSocket.on('chat message', (msg: Message) => {
      // Ensure timestamp is a Date object if it comes as string
      if (msg.timestamp && typeof msg.timestamp === 'string') {
        msg.timestamp = new Date(msg.timestamp);
      }
      setMessages((prevMessages) => [...prevMessages, msg]);
    });

    newSocket.on('connect_error', (err) => {
      console.error('Connection Error:', err);
      alert(`Failed to connect to the chat server at ${SOCKET_SERVER_URL}. Error: ${err.message}. Please ensure the server is running and accessible.`);
    });

    return () => {
      newSocket.off('connect');
      newSocket.off('disconnect');
      newSocket.off('chat message');
      newSocket.off('connect_error');
      newSocket.disconnect();
    };
  }, [username]); // Re-run effect if username changes

  const handleSendMessage = (text: string) => {
    if (socket && text.trim() && username && isConnected) {
      const messageToSend: Message = {
        text,
        sender: username,
        timestamp: new Date(),
      };
      socket.emit('chat message', messageToSend);
    } else if (!isConnected) {
        alert("Not connected to the server. Please wait or try refreshing.");
    }
  };

  if (!username) {
    // This state is brief, as prompt is blocking.
    // Could be replaced with a more elaborate username input screen.
    return <p>Please enter a username to start chatting.</p>;
  }

  return (
    <div className="chat-window">
      <h1>{username}'s Chat Room {isConnected ? "(Connected)" : "(Connecting...)"}</h1>
      <MessageList messages={messages} currentUser={username} />
      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatWindow;

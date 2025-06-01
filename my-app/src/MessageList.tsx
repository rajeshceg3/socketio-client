import React, { useEffect, useRef } from 'react';
import { Message } from './ChatWindow'; // Import the Message interface

interface MessageListProps {
  messages: Message[];
  currentUser: string; // To identify user's own messages
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUser }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null); // For auto-scrolling

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom(); // Scroll to bottom every time messages update
  }, [messages]);

  return (
    <div className="message-list">
      <h2>Messages</h2> {/* This h2 is hidden by CSS but good for structure */}
      {messages.length === 0 && <p>No messages yet. Start chatting!</p>}
      <ul>
        {messages.map((message, index) => {
          const messageType = message.sender === currentUser ? 'sent' : 'received';
          return (
            <li key={message.id || index} className={`message-item-wrapper ${messageType}`}>
              <div className={`message-item ${messageType}`}>
                {messageType === 'received' && (
                  <div className="message-sender">{message.sender}</div>
                )}
                <div className="message-text">{message.text}</div>
                {message.timestamp && (
                  <div className="message-timestamp">
                    {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                )}
              </div>
            </li>
          );
        })}
      </ul>
      <div ref={messagesEndRef} /> {/* Invisible element to scroll to */}
    </div>
  );
};

export default MessageList;

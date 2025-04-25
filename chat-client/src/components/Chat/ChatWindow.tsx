import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { socketService } from '../../services/socket';  
import './ChatWindow.css';
import MessageList from './MessageList';

const ChatWindow: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  interface Message {
    content: string;
    fullName: string;
    createdAt: string;
  }
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { receiverId, senderId } = useParams<{ receiverId: string; senderId: string }>();

  useEffect(() => {
    const initializeSocket = async () => {
      const token = localStorage.getItem('token');
      if (token && senderId) {
        try {
          await socketService.initializeSocket(token, senderId);
          console.log('WebSocket initialized successfully');
        } catch (error) {
          console.error('Error initializing WebSocket:', error);
        }
      } else {
        console.error('Token or senderId is missing');
      }
    };

    initializeSocket();

    return () => {
      console.log('Cleaning up WebSocket connection...');
      const socket = socketService.getSocket();
      if (socket) {
        socket.off('message');
      }
      socketService.disconnect();
    };
  }, []);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (!socket || !socket.connected) {
      const token = localStorage.getItem('token');
      if (token && senderId && receiverId) {
        socketService.initializeSocket(token, senderId);
      }
    }

    return () => {
      socketService.disconnect();
    };
  }, [senderId, receiverId]);

  useEffect(() => {
    const socket = socketService.getSocket();
    if (socket) {
      socket.on('new_message', (message: any) => {
        console.log('New message received:', message);
        console.log('Sender details:', message.sender?.data);

        const senderFullName = message.sender?.data?.fullname || 'Unknown';

        setMessages((prevMessages) => [
          ...prevMessages,
          {
            content: message.content,
            fullName: senderFullName,
            createdAt: message.createdAt || new Date().toISOString(),
          },
        ]);
      });
    }

    return () => {
      if (socket) {
        socket.off('new_message');
      }
    };
  }, []);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim()) {
      console.error('Message content is empty');
      return;
    }

    if (!receiverId || !senderId) {
      return;
    }

    const payload = {
      receiverId,
      senderId,
      content: newMessage,
    };


    const socket = socketService.getSocket();
    if (!socket || !socket.connected) {
      return;
    }

    socket.emit('send_message', payload, (response: any) => {
      if (response.status === 'success') {
    setMessages((prevMessages) => [
      ...prevMessages,
      {
        content: newMessage,
        fullName: 'You',
        createdAt: new Date().toISOString(),
      },
    ]);
      } else {
      }
    });

    setNewMessage('');
  };
  
  return (
    <div className="chat-window">
      {/* Chat Header */}
      <div className="chat-header">
        <button className="back-button" onClick={() => window.history.back()}>
          &#8592;
        </button>
        <div className="chat-header-info">
          <img
            src="https://via.placeholder.com/40" // Replace with the user's avatar URL
            alt="User Avatar"
            className="user-avatar"
          />
          <div>
            <h2>{receiverId ? `User ${receiverId}` : 'Chat'}</h2>
            <span className="chat-status">Online</span>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="messages">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`message ${message.fullName === 'You' ? 'sent' : 'received'}`}
          >
            <p className="message-content">{message.content}</p>
            <span className="timestamp">
              {new Date(message.createdAt).toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
        ))}
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="send-message-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={isLoading}
        />
        <button type="submit" disabled={isLoading}>
          &#9658; {/* Send Icon */}
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;

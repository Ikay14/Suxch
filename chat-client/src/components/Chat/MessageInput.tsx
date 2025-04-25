import React, { useState } from 'react';

interface MessageInputProps {
    onSend: (message: string) => void;
    disabled?: boolean; // <-- Add this (optional)
  }

const MessageInput: React.FC<MessageInputProps> = ({ onSend, disabled }) => {
    const [message, setMessage] = useState('');

    const handleSend = () => {
        if (message.trim()) {
            onSend(message);
            setMessage('');
        }
    };

    return (
        <div className="message-input">
            <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            />
            <button onClick={handleSend}>Send</button>
        </div>
    );
};

export default MessageInput;
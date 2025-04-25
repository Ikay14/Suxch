import React from 'react';
import type { Message } from '../../types/index'
import './MessageList.css';

interface MessageListProps {
    messages: Message[];
    currentUserId: string;
    receiverId?: string;
}

const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId, receiverId }) => {
    const formatTime = (dateString: string | Date | undefined) => {
        if (!dateString) return 'Time not available';
        const date = new Date(dateString);
        return isNaN(date.getTime()) ? 'Time not available' : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    return (
        <div className="message-list">
            {messages.length === 0 ? (
                <div className="no-messages">No messages yet. Start the conversation!</div>
            ) : (
                messages.map((message) => (
                    <div
                        key={message.messageId}
                        className={`message ${message.senderId === currentUserId ? 'sent' : 'received'}`}
                    >
                        <div className="message-content">
                            {message.fileUrl ? (
                                message.fileUrl.match(/\.(jpeg|jpg|gif|png)$/) ? (
                                    <img src={message.fileUrl} alt="Attachment" className="message-image" />
                                ) : (
                                    <a href={message.fileUrl} target="_blank" rel="noopener noreferrer">
                                        Download file
                                    </a>
                                )
                            ) : (
                                <p>{message.content}</p>
                            )}
                            <span className="message-time">{formatTime(message.createdAt)}</span>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default MessageList;
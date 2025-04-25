import { useEffect, useState } from 'react';
import { sendMessage, receiveMessages } from '../services/api';
import type { Message } from '../../src/types/index'

const useChat = (chatId: string = 'defaultChatId') => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                setLoading(true);
                const initialMessages = await receiveMessages(chatId);
                const messagesWithDate = initialMessages.map(message => ({
                    ...message,
                    timestamp: new Date(message.timestamp)
                }));
                setMessages(messagesWithDate);
                setError(null);
            } catch (err) {
                setError('Failed to load messages');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMessages();
    }, [chatId]);

    const handleSendMessage = async (content: string, senderId: string) => {
        try {
            const newMessage = await sendMessage({
                content,
                senderId,
                chatId
            });

            // Convert timestamp from string to Date
            const messageWithDate = {
                ...newMessage,
                timestamp: new Date(newMessage.timestamp)
            };

            setMessages(prev => [...prev, messageWithDate]);
        } catch (err) {
            setError('Failed to send message');
            console.error(err);
            throw err;
        }
    };

    return {
        messages,
        loading,
        error,
        handleSendMessage,
    };
};

export default useChat;

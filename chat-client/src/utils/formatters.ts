export const formatMessage = (message: string): string => {
    return message.trim();
};

export const formatTimestamp = (timestamp: Date): string => {
    return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};
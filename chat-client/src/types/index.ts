

export interface Message {
    id: string;
    content: string;
    senderId: string;
    chatId: string;
    timestamp: Date;
    receiverId?: string;
    messageType?: string;
    fileUrl?: string;
    createdAt?: Date;
    messageId?: string;
    senderName?: string;
    senderAvatar?: string;
}

export interface User {
    id: string;
    email: string;
    fullname: string;
    avatar?: string;
}

export interface ChatRoom {
    id: string;
    participants: User[];
    lastMessage?: Message;
}

export interface loginResponse {
    msg: string;
    accessToken: string;
    responsePayload: {
        id: string;
        fullname: string;
        email: string;
    }
}


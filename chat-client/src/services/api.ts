import axios from 'axios';

const API_URL = 'http://localhost:3000/api'; 

// Function to send a message
interface SendMessageData {
    content: string;
    senderId: string;
    chatId: string;
}

interface SendMessageResponse {
    id: string;
    content: string;
    senderId: string;
    chatId: string;
    timestamp: string;
}

export const sendMessage = async (messageData: SendMessageData): Promise<SendMessageResponse> => {
    try {
        const response = await axios.post<SendMessageResponse>(`${API_URL}/messages`, messageData);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error sending message');
    }
};

// Function to retrieve messages for a chat room
interface MessageData {
    content: string;
    senderId: string;
    chatId: string;
}

interface Message {
    id: string;
    content: string;
    senderId: string;
    chatId: string;
    timestamp: string;
}

export const getMessages = async (chatId: string): Promise<Message[]> => {
    try {
        const response = await axios.get<Message[]>(`${API_URL}/messages/${chatId}`);
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error retrieving messages');
    }
};

export const receiveMessages = async (chatId: string): Promise<Message[]> => {
    try {
      const response = await axios.get<{ msg: string; data: any[] }>(`${API_URL}/chat/${chatId}`);
      
      if (response.data.msg === 'Messages retrieved successfully') {
        return response.data.data.map((msg: any) => ({
          id: msg.messageId,
          content: msg.content,
          senderId: msg.senderId._id,
          chatId: msg.chatId, 
          timestamp: msg.createdAt, 
          receiverId: msg.receiverId._id,
          messageType: msg.messageType,
          fileUrl: msg.fileUrl,
          createdAt: new Date(msg.createdAt),
          senderName: msg.senderId.fullname,
          senderAvatar: msg.senderId.avatar
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error receiving messages:', error);
      throw new Error('Failed to receive messages');
    }
  }

// Function to upload a file
interface FileData {
    file: File;
}

interface UploadResponse {
    url: string;
    fileName: string;
}

export const uploadFile = async (fileData: FileData): Promise<UploadResponse> => {
    try {
        const response = await axios.post<UploadResponse>(`${API_URL}/upload`, fileData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Error uploading file');
    }
};
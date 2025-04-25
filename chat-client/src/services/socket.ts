import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  // Modify initializeSocket to accept both accessToken and userId
  async initializeSocket(accessToken: string, userId: string): Promise<void> {
    if (this.socket) {
      console.log('Socket already initialized');
      return;
    }

    console.log('Initializing socket with token and userId:', accessToken, userId);

    // Initialize the socket connection with both token and userId
    this.socket = io('http://localhost:8080', {
      auth: {
        token: accessToken,
        userId: userId, // Send userId as part of the auth object
      },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    this.socket.on('send_message', (message: string) => {
      console.log('Received message:', message);
    });
    this.socket.on('fileUpload', (file: any) => {
      console.log('Received file:', file);
    });
    this.socket.on('deleteMessage', (message: string) => {
      console.log('deleted message:', message);
    });
    this.socket.on('UpdatedMessage', (message: string) => {
      console.log('Received message:', message);
    });
    this.socket.on('getUserChatsMessage', (message: string) => {
      console.log('Received message:', message);
    });
    this.socket.on('read_receipt', (message: string) => {
      console.log('Received message:', message);
    });
    this.socket.on('typingt', (message: string) => {
      console.log('Received message:', message);
    });

    this.socket.on('connect_error', (err) => {
      console.error('Connection error:', err);
    });

    this.socket.on('connect_timeout', () => {
      console.log('Connection timeout');
    });
  }

  // Method to get the socket instance
  public getSocket(): Socket | null {
    return this.socket;
  }

  // Disconnect the socket
  disconnect(): void {
    if (this.socket) {
      console.log('Disconnecting WebSocket...');
      this.socket.disconnect();
      this.socket = null;
    }
  }
  // Method to send a message
  sendMessage(receiverId: string, message: string): void {
    const senderId = localStorage.getItem('userId'); // or pass it in
  
    if (!this.socket || !senderId) {
      console.error('Socket not initialized or sender missing');
      return;
    }

    
  
    this.socket.emit(
      'send_message',
      { receiverId, message, senderId },
      (response: any) => {
        if (response.status === 'success') {
          console.log('Message sent:', response.data);
        } else {
          console.error('Send error:', response.message);
        }
      }
    );
  }
  

}
export const socketService = new SocketService();

import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer, WsException } from "@nestjs/websockets";

import { Server, Socket } from "socket.io";
import { ChatService } from "src/modules/chat/chat/chat.service";
import { UserService } from "src/modules/user/user.service";
import { CreateMsgDto } from "./dto/create.msg.dto";

import { TypingDto } from "../chat/dto/typing.msg.dto";
import { StopTypingDto } from "../chat/dto/stop.typing.dto";
import { ReadReceiptDto } from "../chat/dto/read.msg.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Chat } from "../schema/chat.schema";
import { Model } from "mongoose";
import { UploadMsgMediaDto } from "../chat/dto/upload.media.dto";
import { AuthenticatedSocket } from "../interface/authenticated";
import {  UploadedFile, UseFilters, UseGuards, UseInterceptors } from "@nestjs/common";

import { SocketAck } from "src/common/decorator/socket-ack.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import { multerOptions } from "src/common/multer.storage";
import { UpdateMsgDto } from "../chat/dto/update.msg.dto";
import { CustomWsExceptionFilter } from "src/common/ws-exception.filter";
import { WsJwtGuard } from "src/guard/ws.auth.guard";
import { JwtService } from "@nestjs/jwt";

import { WsAuthMiddleware } from "src/middleware/ws-auth.middleware";


@WebSocketGateway({
  cors: {
    path: '/socket.io',
    origin:process.env.FRONTEND_URL || 'http://localhost:3000' ,
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  },
  transports: ['websocket'], 
  allowUpgrades: true,
})
@UseFilters(new CustomWsExceptionFilter()) 
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {

  // store user socket mapping
  private userSocketMap = new Map<string, string>()


  constructor(
    private chatService: ChatService,
    private userService: UserService,
    @InjectModel(Chat.name) private chatModel: Model<Chat>,
    private jwtService: JwtService,
    private readonly wsAuthMiddleware: WsAuthMiddleware
  ) {}

  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    server.use((socket: any, next) => this.wsAuthMiddleware.use(socket, next));
  }


  async handleConnection(client: AuthenticatedSocket) {
    const { token, userId } = client.handshake.auth;
    if (!token) {
      throw new WsException('Authentication token is required');
    }
    try {
      const decoded = this.jwtService.verify(token, { secret: process.env.JWT_SECRET });
      client.userId = decoded.userId; // Attach userId to the socket object
    }
    catch (error) {
      throw new WsException('Invalid token');
    }
    client.join(client.userId); 
 

    if (userId) {
      this.userSocketMap.set(userId, client.id);
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    const userId = [...this.userSocketMap.entries()].find(([_, socketId]) => socketId === client.id)?.[0];
    if (userId) {
      this.userSocketMap.delete(userId);
      console.log(`User ${userId} disconnected`);
    }
  }
  

  @UseGuards(WsJwtGuard)
  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() createDto: CreateMsgDto,
    @SocketAck() ack: (response: any) => void
  ) {
    try {
      // Extract senderId from the client object
      const senderId = client.userId;
      const { content, receiverId } = createDto;

      if (!receiverId || !content) {
        throw new Error('Receiver ID and message content are required');
      }

      const roomId = await this.getConversationRoom(senderId, receiverId);
      console.log(`Generated RoomId room: ${roomId}`);

      // Join both users to the room
      const receiverSocket = this.userSocketMap.get(receiverId);
      if (receiverSocket) {
        this.server.sockets.sockets.get(receiverSocket)?.join(roomId);
      }
      client.join(roomId);

      // Create the message
      const message = await this.chatService.createMessage(roomId, createDto);

      // Fetch sender details
      const senderDetails = await this.userService.getUserById(senderId);
      const receiverDetails = await this.userService.getUserById(receiverId)

      // Include sender details in the emitted message
      const enrichedMessage = {
        ...message.toObject(),
        sender: senderDetails,
        receiver: receiverDetails
      };

      console.log(`Emitting new_message to room ${roomId}:`, enrichedMessage);

      // Emit the new message to the room
      this.server.to(roomId).emit('new_message', enrichedMessage);

      ack({
        status: 'success',
        data: enrichedMessage,
      });
    } catch (error) {
      ack({
        status: 'error',
        message: error.message,
      });
    }
  }
  

  @SubscribeMessage('fileUpload')
  @UseInterceptors(FileInterceptor('file', multerOptions))
  async handleMediaUpload(
    @MessageBody() uploadDto: UploadMsgMediaDto,
    @ConnectedSocket() client: Socket,
    @UploadedFile() file: Express.Request['file'],
    @SocketAck() ack: (response: { status: string; message?: string; data?: any }) => void,
  ) {
    try {
      const senderId = client.handshake.query.userId.toString();
      const receiverId = uploadDto.receiverId;
  
      
      const roomId = await this.getConversationRoom(senderId, receiverId);
  
      //  Ensure both users are in the room (if online)
      const receiverSocketId = this.userSocketMap.get(receiverId);
      if (receiverSocketId) {
        this.server.sockets.sockets.get(receiverSocketId)?.join(roomId);
      }

      client.join(roomId); 
  
      // Upload file and save message
      const uploadResult = await this.chatService.uploadFile({
        senderId,
        receiverId,
        file,
        roomId,
        contentType: file.mimetype, // Assuming file has a mimetype property
        replyToMsg: uploadDto.replyToMsg || null // Assuming replyToMsg is optional
      }, file);
  
      // Emit to conversation room
      this.server.to(roomId).emit('file-sent', {
        roomId,
        fileUrl: uploadResult.newMsg.fileUrl, 
        senderId,
        messageId: uploadResult.newMsg._id,
        timestamp: new Date().toISOString()
      });
  
      // Optionally notify recipient's other devices
      this.server.to(receiverId).emit('file-notification', {
        senderId,
        preview: uploadResult.newMsg.fileUrl 
      });
  
      // 6. Acknowledge success
      ack({
        status: 'success',
        data: {
          roomId,
          fileUrl: uploadResult.newMsg.fileUrl,
          messageId: uploadResult.newMsg._id,
        }
      });
    } catch (error) {
      console.error('File upload error:', error);
      ack({
        status: 'error',
        message: error.message || 'File upload failed'
      });
      throw error;
    }
  }
  

    

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @MessageBody('messageId') messageId: string,
    @SocketAck() ack: (response: { status: string; message: string; data?: any }) => void,
  ) {
    const result = await this.chatService.delMsgById(messageId);
    ack({ status: 'success', message: result.msg });

    return result
  }

  @SubscribeMessage('updateMessage')
  async handleUpdateMessage(
    @MessageBody() updateMsgDto: UpdateMsgDto,
    @SocketAck() ack: (response: { status: string; message: string; data?: any }) => void,
  ) {
    const result = await this.chatService.updateUserMsg(updateMsgDto);
    ack({ status: 'success', message: result.msg, data: result.data });

    return result;
  }

  @SubscribeMessage('deleteChat')
  async handleDeleteChat(
    @MessageBody('chatId') chatId: string,
    @SocketAck() ack: (response: { status: string; message: string; data?: any }) => void,
  ) {
    const result = await this.chatService.delChatById(chatId);
    ack({ status: 'success', message: result.msg });

    return result
  }

  @SubscribeMessage('getChatById')
  async handleGetChatById(
    @MessageBody('chatId') chatId: string,
    @SocketAck() ack: (response: { status: string; message: string; data?: any }) => void,
  ) {
    const result = await this.chatService.getChatById(chatId);
    ack({ status: 'success', message: result.msg, data: result.data });

    
    return result;
  }

  @SubscribeMessage('getUserChats')
  async handleGetUserChats( 
    @MessageBody() payload: { userId: string; skip: number; limit: number },
    @SocketAck() ack: (response: { status: string; message: string; data?: any }) => void,
  ) {
    const { userId, skip, limit } = payload;
    const result = await this.chatService.getUserChats(userId, skip, limit);
    ack({ status: 'success', message: result.msg, data: result.data });

    return result;
    
  }

    @SubscribeMessage('read_receipt')
    async handleReadReceipt(
        @ConnectedSocket() client: Socket,  
        @MessageBody() readReceiptDto: ReadReceiptDto
    ) {
        const { messageId, receiverId } = readReceiptDto
         
    // Update message status in database
        await this.chatModel.updateOne(
        { _id: messageId, receiver: receiverId },
        { $set: { status: 'read', readAt: new Date() } }  
      );

    // Notify sender that the message was read
    this.server.to(receiverId).emit('message_read', { messageId, status: 'read', receiverId });
    }

    @SubscribeMessage('typing')
    async handleTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() typingDto: TypingDto
    ) {
        const { senderId, receiverId, chatId } = typingDto
         
        // Ensure both sender and receiver are in the same room
        this.server.to(chatId).emit('typing', { senderId})

     // Automatically stop typing after 5 seconds
     setTimeout(() => {
        this.server.to(chatId).emit('stop_typing', { senderId });
    }, 5000);
    }

    @SubscribeMessage('stop_typing')
    async handleStopTyping(
        @ConnectedSocket() client: Socket,
        @MessageBody() stopTypingDto: StopTypingDto
    ) {
        const { senderId, receiverId } = stopTypingDto

        // Ensure both sender and receiver are in the same room
        const room = [senderId, receiverId].sort().join('-');
        this.server.to(room).emit('stop_typing', { senderId})
    }


    private async joinConversationRooms(client: Socket, userId:string) {
      const conversations = await this.chatService.getUserConversations(userId);
      
      conversations.forEach(conv => {
        client.join(conv.roomId);
      });
    }

   
    async getConversationRoom(senderId: string, receiverId: string): Promise<string> {
      const participants = [senderId, receiverId].sort(); // Sort IDs to ensure consistency
      return `conv_${participants.join('_')}`;
    }

  }




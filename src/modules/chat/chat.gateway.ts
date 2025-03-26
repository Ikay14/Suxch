import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { log } from "node:console";
import { Server, Socket } from "socket.io";
import { ChatService } from "src/modules/chat/chat.service";
import { CreateMsgDto } from "./dto/create.msg.dto";
import { client } from "src/db/data.source";
import { TypingDto } from "./dto/typing.msg.dto";
import { StopTypingDto } from "./dto/stop.typing.dto";
import { ReadReceiptDto } from "./dto/read.msg.dto";
import { InjectModel } from "@nestjs/mongoose";
import { Chat } from "./schema/chat.schema";
import { Model } from "mongoose";
import { UploadMsgMediaDto } from "./dto/upload.media.dto";
import { User } from "../user/schema/user.schema";
import { forwardRef, Inject, UploadedFile, UseFilters, UseInterceptors } from "@nestjs/common";
import { WsExceptionFilter } from "src/common/ws-exception.filter";
import { SocketAck } from "src/common/decorator/socket-ack.decorator";
import { FileInterceptor } from "@nestjs/platform-express";
import { multerOptions } from "src/common/multer.storage";
import { UpdateMsgDto } from "./dto/update.msg.dto";

@WebSocketGateway({ namespace: 'chat' })
@UseFilters(new WsExceptionFilter())
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
       private chatService: ChatService,
        @InjectModel(Chat.name) private chatModel: Model<Chat>,
      
     ){ console.log('ChatGateway initialized')}
    @WebSocketServer() server : Server

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
      
        
        const userId = client.handshake.query.userId;
        if (userId) {
          client.join(userId); // Join user-specific room
        }
      }
      
      handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
      
        // Remove user from rooms
        const userId = client.handshake.query.userId;
        if (userId) {
          if (typeof userId === 'string') {
            client.leave(userId);
          }
        }
      }

      @SubscribeMessage('message')
      async handleMessage(
          @ConnectedSocket() client: Socket,
          @MessageBody() createMsg: CreateMsgDto) {
          try {
              const { senderId, receiverId } = createMsg;        
              const message = await this.chatService.createMessage(createMsg);

              const chatId = [senderId, receiverId].sort().join('-'); 
              client.join(chatId);
              this.server.to(chatId).emit('message', { message, sender: senderId, receiver: receiverId });
              return message;
          } catch (error) {
             
              throw new Error('Failed to process message');
          }
      }

      @SubscribeMessage('fileUpload')
      @UseInterceptors(FileInterceptor('file', multerOptions)) 
      async handleMediaUpload(
        @MessageBody() uploadMsgMediaDto: UploadMsgMediaDto,
        @ConnectedSocket() client: Socket,
        @UploadedFile() file: Express.Request['file'],
        @SocketAck() ack: (response: { status: string; message?: string; data?: any }) => void,
      ) {
        try {
          console.log('Received file:', file);
      
          // Upload the file to Cloudinary
          const fileUrl = await this.chatService.uploadFile(uploadMsgMediaDto, file);
      
          // Join the chat room
          client.join(uploadMsgMediaDto.chatId);
      
          // Acknowledge success
          ack({
            status: 'success',
            message: 'File uploaded successfully',
            data: { chatId: uploadMsgMediaDto.chatId, fileUrl },
          });
        } catch (error) {
          console.error('Error in handleMediaUpload:', error);
      
          // Acknowledge failure
          ack({
            status: 'error',
            message: error.message || 'File upload failed',
          });
      
          // Re-throw the error for further handling by exception filters
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
}  
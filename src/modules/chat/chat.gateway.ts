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

@WebSocketGateway({ namespace: 'chat' })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(private chatService: ChatService,
        @InjectModel(Chat.name) private chatModel: Model<Chat>
     ){}
    @WebSocketServer() server : Server

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('message')
    async handleMessage(
        @ConnectedSocket()client: Socket,
        @MessageBody() createMsg: CreateMsgDto){

    const { senderId, receiverId } = createMsg;        

    const message = await this.chatService.createMessage(createMsg)

     // Ensure both sender and receiver are in the same room
     const room = [senderId, receiverId].sort().join('-');
     client.join(room);

     // Emit message to both sender & receiver
     this.server.to(room).emit('message', { message, sender: senderId, receiver: receiverId });

     return message;
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
        const { senderId, receiverId } = typingDto
         
        // Ensure both sender and receiver are in the same room
        const room = [senderId, receiverId].sort().join('-');
        this.server.to(room).emit('typing', { senderId})
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
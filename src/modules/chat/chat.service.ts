import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from "uuid";
import { Chat } from './schema/chat.schema';
import { Model } from 'mongoose';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

import { CreateMsgDto } from './dto/create.msg.dto';
import { UpdateMsgDto } from './dto/update.msg.dto';
import { DeleteMsgDto } from './dto/delete.msg.dto';
import { ReadReceiptDto } from './dto/read.msg.dto';
import { User } from '../user/schema/user.schema';
import { UploadMsgMediaDto } from './dto/upload.media.dto';
import { CloudinaryService } from 'src/services/cloudinary.service';

import { ChatGateway } from './chat.gateway';
import { plainToClass } from 'class-transformer';
import { MessageDto } from './response.dto/message.res.dto';
import { populate } from 'dotenv';



@Injectable()
export class ChatService {
    constructor (
        @InjectModel(Chat.name) 
        private chatModel: Model<Chat>,
        @InjectModel(User.name)
        private userModel: Model<User>,
        @InjectRedis() private redisClient: Redis,
        private cloudinaryService: CloudinaryService,
        
    ){console.log('ChatService initialized');}

    async createMessage(createMsg: CreateMsgDto) {
        
    const { senderId, receiverId, content, messageType, replyTo } = createMsg;
    if (!senderId || !receiverId || !content || !messageType ) 
        throw new BadRequestException('please provide all fields')
        console.log('Received payload:', createMsg);
        const msgId = uuidv4();

         // Validate replyTo message exists if provided
        if (replyTo) {
         const parentMessage = await this.chatModel.findOne({ messageId: replyTo });
         if (!parentMessage) throw new BadRequestException('Original message not found');
  }
        
     console.log('values:', {createMsg} );

        const chatRoom = await this.createChatRoom(senderId, receiverId);      
    

        const newMsg = await this.chatModel.create({
            chatId: chatRoom,
            messageId: msgId,
            senderId,
            receiverId,
            messageType, 
            content
        }); 
        
        console.log('Message saved to DB:', newMsg);

        return {
            msg: "Message sent",
            data: newMsg
        }; 
    }

    async uploadFile(uploadMsgMediaDto: UploadMsgMediaDto, file: Express.Request['file']){
        const { senderId, receiverId, contentType } = uploadMsgMediaDto;
        
        const msgId = uuidv4();

       
        if (!senderId || !receiverId) 
            throw new BadRequestException('Sender and receiver must be provided');

        const folder = `chat-files/${senderId}:${receiverId}`

        const content = file.mimetype.startsWith('image/')
        ? 'image'
        :  file.mimetype.startsWith('audio/')
        ? 'video'
        : 'raw'
        
        const fileUrl = await this.cloudinaryService.uploadFile(file, folder, content)

        const chatRoom = await this.createChatRoom(senderId, receiverId)

        const newMsg = await this.chatModel.create(
            {
                senderId,
                receiverId,
                chatId: chatRoom,
                messageId: msgId,
                messageType: content,
                fileUrl
            }
        )


        // // Emit the WebSocket event to the room
        // this.chatGateway.server.to(chatRoom).emit('fileUploaded', uploadMsgMediaDto)
    
        return {
            msg: 'Chat media uploaded successfully',
            newMsg
        }
    }

    async getChatById(chatId: string){

        const chatKey = `messageKey:${chatId}`

        const cachedChat = await this.redisClient.get(chatKey)

        if(cachedChat)
            return {
        msg: 'message retrieved successfully',
        data: JSON.parse(cachedChat) 
    }

        const chat =  await this.chatModel.findOne({chatId: chatId, isDeleted: { $ne: true }})
        .populate('senderId')
        .populate('receiverId')

        if(!chat) throw new NotFoundException('chat not found')

          await this.redisClient.set(
            chatKey,
            JSON.stringify(chat),
            'EX',
            3600
          )

        const responseDto = plainToClass(MessageDto, chat, {
            excludeExtraneousValues: true
        })    

        return {
            msg: 'Chat retrieved successfully',
            data: responseDto
        }    
    }

    async getUserChats(userId: string,  skip: number,  limit: number){

        const chatKey = `userChatsKey:${userId}`

        const cachedMsg = await this.redisClient.get(chatKey);
        if(cachedMsg) 
            return {
            msg: 'message retrieved from cache memory',  
            data: JSON.parse(cachedMsg)
        }

        const user = await this.userModel.findById(userId)
        if(!user) throw new NotFoundException('user not found')

        const userChats = await this.chatModel.aggregate([

         { 
            $match: { 
                $or: [ { senderId: userId }, { receiverId: userId } ],
                isDeleted: {$ne : true}
        },   
         },

        {  $group:  { _id: '$chatId', 
            participants: { $addToSet: "$senderId" }, // Collect unique senderIds
            lastMessage: { $last: "$$ROOT" } 
         } },

        { $lookup : {
            from : 'users',
            localField: 'lastMessage.senderId',
            foreignField: '_id',
            as: 'sender'
        }},

        { $lookup : {
            from : 'users',
            localField: 'lastMessage.receiverId',
            foreignField: '_id',
            as: 'receiver'
        }},
        
        { $project : {
            chatId : '$_id',
            participants: 1,
            lastMessage: {
                   content: "$lastMessage.content",
                   messageType: "$lastMessage.messageType",
                    senderId: "$lastMessage.senderId",
                   receiverId: "$lastMessage.receiverId",
                   fileUrl: "$lastMessage.fileUrl",
                   messageId: "$lastMessage.messageId",
                   createdAt: "$lastMessage.createdAt"
               },
               sender: { $arrayElemAt : ["$sender", 0] },
               receiver: { $arrayElemAt : ["$receiver", 0] }
        }}
    ]).skip(skip)
    .limit(limit)

        await this.redisClient.set(
            chatKey,
            JSON.stringify(userChats),
            'EX',
            3600 
        )

       const responseDto = plainToClass(MessageDto, userChats, {
        excludeExtraneousValues: true
       }) 

       return {
        msg: 'Message retrieved successfully',
            data: responseDto
       }
    }


    async delMsgById(msgId: string){

    const msg =  await this.chatModel.findOneAndUpdate(
        {messageId: msgId},
        {isDeleted: true},
        { new: true }
    )
        
        if(!msg) throw new NotFoundException('message not found')

        return {
            msg: 'message deleted successfully',
        }    
    }



    async updateUserMsg(updateMsgDto: UpdateMsgDto){

        const { userId, messageId, newContent } = updateMsgDto

        const user = await this.userModel.findById(userId)
        if(!user) throw new NotFoundException('user not found')
        
        const message = await this.chatModel.findOneAndUpdate(
            { messageId }, 
            { $set: { content: newContent } },
            { new: true }
        )    
      
        const responseDto = plainToClass(MessageDto, message, {
            excludeExtraneousValues: true
        });

        return {
            msg: 'Message updated successfully',
            data: responseDto
        };
    }


    async delChatById(chatId: string){

        const chat =  await this.chatModel.findOneAndUpdate(
            {chatId: chatId},
            {isDeleted: true},
            { new: true }
        )
            
            if(!chat) throw new NotFoundException('chat not found')
    
            return {
                msg: 'chat deleted successfully',
            }    
        }


    private async createChatRoom  (senderId: string, receiverId: string)  {
        const chatId = uuidv4()
        return chatId
    }
    
}

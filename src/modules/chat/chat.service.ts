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
        @Inject(forwardRef(() => ChatGateway)) private chatGateway: ChatGateway,
        @InjectModel(Chat.name) 
        private chatModel: Model<Chat>,
        @InjectModel(User.name)
        private userModel: Model<User>,
        @InjectRedis() private redisClient: Redis,
        private cloudinaryService: CloudinaryService,
        
    ){console.log('ChatService initialized');}

    async createMessage(createMsg: CreateMsgDto) {
        const msgId = uuidv4();
        
        const { senderId, receiverId, content, messageType } = createMsg;
    
        if (!senderId || !receiverId) 
            throw new BadRequestException('Sender and receiver must be provided');
    
        // Create the message in one step (assumes sender & receiver exist)
        const newMsg = await this.chatModel.create({
            messageId: msgId,
            senderId,
            receiverId,
            messageType,
            content
        });
    
        return {
            msg: "Message sent",
            data: newMsg
        };
    }

    async uploadMedia(uploadMsgMediaDto: UploadMsgMediaDto, file: Express.Request['file']){
        const msgId = uuidv4();

        const { senderId, receiverId, contentType } = uploadMsgMediaDto;

        if (!senderId || !receiverId) 
            throw new BadRequestException('Sender and receiver must be provided');

        const folder = `chat-files/${senderId}:${receiverId}`

        const content = file.mimetype.startsWith('image/')
        ? 'image'
        :  file.mimetype.startsWith('audio/')
        ? 'video'
        : 'raw'
        
        const fileUrl = await this.cloudinaryService.uploadFile(file, folder, content)

        const newMsg = await this.chatModel.create(
            {
                senderId,
                receiverId,
                messageId: msgId,
                messageType: content,
                fileUrl
            }
        )

         // Create the room name
         const room = [senderId, receiverId].sort().join('-');

        // Emit the WebSocket event to the room
        this.chatGateway.server.to(room).emit('fileUploaded', uploadMsgMediaDto)
    
        return {
            msg: 'Chat media uploaded successfully',
            newMsg
        }
    }

    async getMessageById(msgId: string){

        const msgKey = `messageKey:${msgId}`

        const cachedMsg = await this.redisClient.get(msgKey)

        if(cachedMsg)
            return {
        msg: 'message retrieved successfully',
        data: JSON.parse(cachedMsg)
    }

        const message =  await this.chatModel.findOne({messageId: msgId})
        .populate('senderId')
        .populate('receiverId')

        if(!message) throw new NotFoundException('message not found')

          await this.redisClient.set(
            msgKey,
            JSON.stringify(message),
            'EX',
            3600
          )

        const responseDto = plainToClass(MessageDto, message, {
            excludeExtraneousValues: true
        })    

        return {
            msg: 'Message retrieved successfully',
            data: responseDto
        }    
    }

    async getUserChats(userId: string){

        const chatKey = `userChatsKey:${userId}`

        const cachedMsg = await this.redisClient.get(chatKey);
        if(cachedMsg) 
            return {
            msg: 'message retrieved from cache memory',  
            data: JSON.parse(cachedMsg)
        }

        const user = await this.userModel.findById(userId)
        if(!user) throw new NotFoundException('user not found')

        const userChats = await this.chatModel.find({
         $or: [ { senderId:userId },{ receiverId: userId }]
        })
        .populate('senderId')
        .populate('receiverId')
        .lean

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
    
}

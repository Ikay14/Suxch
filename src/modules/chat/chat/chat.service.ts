import { BadRequestException, forwardRef, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { v4 as uuidv4 } from "uuid";
import { Chat } from '../schema/chat.schema';
import { Model, Types } from 'mongoose';
import { InjectRedis } from '@nestjs-modules/ioredis';
import Redis from 'ioredis';

import { CreateMsgDto } from './dto/create.msg.dto';
import { UpdateMsgDto } from './dto/update.msg.dto';
import {fileTypeFromBuffer} from 'file-type'
import { User } from '../../user/schema/user.schema';
import { UploadMsgMediaDto } from './dto/upload.media.dto';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { Readable } from 'stream';





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
        
    const { senderId, receiverId, content, messageType, replyTo, chatId } = createMsg;

        const msgId = uuidv4();

         // Validate replyTo message exists if provided
        if (replyTo) {
         const parentMessage = await this.chatModel.findOne({ messageId: replyTo });
         if (!parentMessage) throw new BadRequestException('Original message not found');
  }
        
        const chatRoom = chatId || await this.createChatRoom(senderId, receiverId);      

        const newMsg = await this.chatModel.create({
            chatId: chatRoom,
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

    async uploadFile(uploadMsgMediaDto: UploadMsgMediaDto, file: Express.Request['file'] | Buffer) {
        const { senderId, receiverId } = uploadMsgMediaDto;
    
        try {
            if (!senderId || !receiverId) {
                throw new BadRequestException('Sender and receiver must be provided');
            }
    
            const msgId = uuidv4();
            const folder = `chat-files/${senderId}:${receiverId}`;
    
            // Handle both Buffer and Multer file cases
            let buffer: Buffer;
            let mimeType: string;
            let originalName: string;
    
            if (file instanceof Buffer) {
                buffer = file;
                const typeResult = await fileTypeFromBuffer(buffer);
                mimeType = typeResult?.mime || 'application/octet-stream';
                originalName = `file-${msgId}`;  
            } else {
                buffer = Buffer.from(file.buffer);
                if ('mimetype' in file) {
                    mimeType = file.mimetype;
                } else {
                    throw new BadRequestException('Invalid file type');
                }
                originalName = 'originalname' in file ? file.originalname : `file-${msgId}`;
            }
    
            // Upload to Cloudinary with proper type detection
            const fileUrl = await this.cloudinaryService.uploadFile({  
                buffer,
                originalname: originalName,
                mimetype: mimeType,
                fieldname: '',
                encoding: '',
                size: 0,
                stream: new Readable,
                destination: '',
                filename: '',
                path: ''
            }, folder);
    
            const chatRoom = await this.createChatRoom(senderId, receiverId);
    
            const newMsg = await this.chatModel.create({ 
                senderId,
                receiverId,
                chatId: chatRoom,
                messageId: msgId,
                fileUrl,
                fileType: mimeType
            });
    
            return {
                msg: 'Chat media uploaded successfully',
                newMsg
            };
        } catch (error) {
            console.error('Error in uploadFile:', error);
            throw new BadRequestException(error.message || 'Error uploading media');
        }
    }


    async getChatById(chatId: string) {
        const chatKey = `messageKey:${chatId}`;
      
        // Check Redis cache
        const cachedChat = await this.redisClient.get(chatKey);
        if (cachedChat) {
          return {
            msg: 'Messages retrieved successfully',
            data: JSON.parse(cachedChat),
          };
        }
      
    
        const chat = await this.chatModel.find({ chatId: chatId, isDeleted: { $ne: true } })
          .populate({
            path: 'senderId',
            select: '-password -otp -otpExpires -__v', 
          })
          .populate({
            path: 'receiverId',
            select: '-password -otp -otpExpires -__v',
          })
          .sort({ createdAt: 1 }); 
      
        if (!chat || chat.length === 0) {
          throw new NotFoundException('No messages found for this chat');
        }
      
        // Cache the result in Redis
        await this.redisClient.set(chatKey, JSON.stringify(chat), 'EX', 3600);

      
        return {
          msg: 'Messages retrieved successfully',
          data: chat,
        };
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
                $or: [ 
                    { senderId: new Types.ObjectId(userId) }, 
                    { receiverId: new Types.ObjectId(userId) } 
                ],
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
               sender: { 
                _id: 1, 
                email: 1, 
                fullname: 1, 
                avatar: 1, 
                tel: 1
                },
               receiver: { 
                _id: 1, 
                email: 1, 
                fullname: 1, 
                avatar: 1,
                tel : 1 
               }
        }}
    ]).skip(skip)
    .limit(limit)

        await this.redisClient.set(
            chatKey,
            JSON.stringify(userChats),
            'EX',
            3600 
        )
       

       return {
        msg: 'Chats retrieved successfully',
            data: userChats 
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
            { messageId,  isDeleted: { $ne: true } }, 
            { $set: { content: newContent } }, 
            { new: true }
        )    

        if (!message) {
            throw new NotFoundException('Message not found or cannot be updated');
          }
      
        return {
            msg: 'Message updated successfully',
            data: message 
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

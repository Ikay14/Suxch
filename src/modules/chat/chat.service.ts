import { BadRequestException, Injectable } from '@nestjs/common';
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


@Injectable()
export class ChatService {
    constructor (
        @InjectModel(Chat.name) 
        private chatModel: Model<Chat>,
        @InjectModel(User.name)
        private userModel: Model<User>,
        @InjectRedis() private redisClient: Redis
    ){}

    async createMessage(createMsg: CreateMsgDto) {
        const msgId = uuidv4();
        
        const { senderId, receiverId, content } = createMsg;
    
        if (!senderId || !receiverId) 
            throw new BadRequestException('Sender and receiver must be provided');
    
        // Create the message in one step (assumes sender & receiver exist)
        const newMsg = await this.chatModel.create({
            messageId: msgId,
            senderId,
            receiverId,
            content
        });
    
        return {
            msg: "Message sent",
            data: newMsg
        };
    }
    
}

import { Model } from "mongoose";
import { Group } from "../schema/group.schema";
import { User } from "src/modules/user/schema/user.schema";
import { GroupMessage } from "../schema/message.group.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";
import { CloudinaryService } from "src/services/cloudinary.service";
import { Chat } from "../schema/chat.schema";

import { CreateGroupDTo } from "./dto/createGroupMsg.dto";
import { v4 as uuidv4 } from "uuid";


@Injectable()
export class GroupChatService {
    constructor(
        @InjectModel(Group.name) private groupInfo: Model<Group>,
        @InjectModel(GroupMessage.name) private groupMsg: Model<GroupMessage>,
        @InjectModel(Chat.name)  private chatModel: Model<Chat>,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectRedis() private redisClient: Redis,
        private cloudinaryService: CloudinaryService,
    ){console.log('Group Chat Service Initialized');
    }
    

    // create group

    async createGroup(createGroup : CreateGroupDTo, userId : string ){

        try {

            const { name, description, createdBy } = createGroup

            const groupId = uuidv4();
    
             const user = await this.userModel.findById(userId)
             if(!user) throw new NotFoundException('user not found')
    
            let newGroup = await this.groupInfo.create({
                    name,
                    description,
                    groupId,
                    createdBy: userId
                })
                return {
                    msg: 'group created successfully',
                    data: newGroup
                }
            
        } catch (error: any) {
            console.error(error.message)
        }
            
            
    }

}
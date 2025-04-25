import { Model } from "mongoose";
import { Group, Role } from "../schema/group.schema";
import { User } from "src/modules/user/schema/user.schema";
import { Conversation } from "../schema/conversation.group.schema";
import { InjectModel } from "@nestjs/mongoose";
import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRedis } from "@nestjs-modules/ioredis";
import Redis from "ioredis";
import { CloudinaryService } from "src/services/cloudinary.service";
import { Chat } from "../schema/chat.schema";

import { CreateGroupDTo } from "./dto/create.group.dto";
import { v4 as uuidv4 } from "uuid";
import { UpdateGroupDetailsDto } from "./dto/update.group.details.dto";
import { AddMemberDto } from "./dto/add.member.dto";


@Injectable()
export class GroupService {
    constructor(
        @InjectModel(Group.name) private groupInfo: Model<Group>,
        @InjectModel(Conversation.name) private groupMsg: Model<Conversation>,
        @InjectModel(Chat.name)  private chatModel: Model<Chat>,
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectRedis() private redisClient: Redis,
        private cloudinaryService: CloudinaryService,
    ){console.log('Group Chat Service Initialized');
    }
    

    // create group

    async createGroup(createGroup : CreateGroupDTo, userId : string ){

        try {

            const { name, description } = createGroup

            const groupId = uuidv4();
    
             const user = await this.userModel.findById(userId)
             if(!user) throw new NotFoundException('user not found')
    
            const newGroup = await this.groupInfo.create({
                    name,
                    description,
                    groupId,
                    createdBy: userId,
                    members: [{
                        userId,
                        role: Role.ADMIN,
                        addedBy: userId,
                        joinedAt: new Date()
                    }],
                })
                return {
                    msg: 'group created successfully',
                    data: newGroup
                }
            
        } catch (error: any) {
            console.error('Error creating Group', error.message)
            throw new Error('Error creating Group')    
        }
    }


    // add members to a group

    async addMemberToGroup(addMem: AddMemberDto) {

        const { groupId, userId, adminId } = addMem;
        try {
          // Find the group by groupId
          const group = await this.groupInfo.findOne({ groupId });
          if (!group) throw new NotFoundException('Group not found');
      
          // Find the user by userId
          const user = await this.userModel.findById(userId);
          if (!user) throw new NotFoundException('User not found');
      
          // Check if the user trying to add a member is the creator or an admin
          const isAdmin = group.members.some(
            (member) => member.userId === adminId && member.role === 'admin'
          );
      
          if (!isAdmin) {
            throw new Error('You are not authorized to add a member to this group');
          }
      
          // Check if the user to be added is already a member
          const isMember = group.members.some(
            (member) => member.userId === userId
          );
          if (isMember) throw new Error('User is already a member of this group');
      
          // Add the new member to the group
          group.members.push({
            userId,
            role: Role.MEMBER,
            addedBy: adminId,
            joinedAt: new Date(),
          });
    
          await group.save();
      
          return {
            msg: 'Member added successfully',
            data: group,
          };
        } catch (error: any) {
          console.error('Error adding Member to Group', error.message);
          throw new Error('Error adding Member to Group');
        }
      }

    //   make member an admin
    async makeMemberAdmin(makeMemAdmin: AddMemberDto) {
        const { groupId, userId, adminId } = makeMemAdmin;
        try {
          // Find the group by groupId
          const group = await this.groupInfo.findOne({ groupId });
          if (!group) throw new NotFoundException('Group not found');
      
          // Find the user by userId
          const user = await this.userModel.findById(userId);
          if (!user) throw new NotFoundException('User not found');
      
          // Check if the user trying to add a member is an admin
          const isAdmin = group.members.some(
            (member) => member.userId === adminId && member.role === 'admin'
          );
      
          if (!isAdmin) {
            throw new Error('You are not authorized to make a member an admin in this group');
          }
      
          // Check if the user to be made an admin is already a member
          const isMember = group.members.some(
            (member) => member.userId === userId
          );
          if (!isMember) throw new Error('User is not a member of this group');
      
          // Check if the user to be made an admin is already an admin
          const isAlreadyAdmin = group.members.some(
            (member) => member.userId === userId && member.role === 'admin'
          );
          if (isAlreadyAdmin) throw new Error('User is already an admin of this group');
      
          // Make the member an admin
          group.members.forEach((member) => {
            if (member.userId === userId) {
              member.role = Role.ADMIN;
            }
          });
    
          await group.save();
      
          return {
            msg: 'Member made an admin successfully',
            data: group,
          };
        } catch (error: any) {
          console.error('Error making Member an Admin', error.message);
          throw new Error('Error making Member an Admin');
        }
      }


    //   remove member from group
      async removeMemberFromGroup(removeMem: AddMemberDto) {

        const { groupId, userId, adminId } = removeMem;
        try {
            
            const isAdmin = await this.groupInfo.findOne({ 
                groupId, 
                'members.userId': adminId, 
                'members.role': Role.ADMIN 
              });
              if (!isAdmin) throw new Error('You are not authorized to remove a member from this group');

            const group = await this.groupInfo.findOneAndUpdate(
            { groupId },
            { $pull: { members: { userId } } },
            { new: true }
        )
        
        if (!group) throw new NotFoundException('Group not found')

        return {
            msg: 'Member removed successfully',
            data: group
        }

        } catch (error: any) {
          console.error('Error removing Member from Group', error.message);
          throw new Error('Error removing Member from Group');  
            
        }
      }


    //   Get all members in a group

    async getAllMembers(groupId: string, skip: number, limit: number) {
        try {

        //create redis key 
        const memKey = `members:${groupId}` 

        // Query from the cached memory
        const cachedMem = await this.redisClient.get(memKey)
        if(cachedMem) 
            return {
                msg: 'Members returned successfully',
                data: JSON.parse(cachedMem),
        }
        // Find the group by groupId
        const group = await this.groupInfo.findOne({ groupId })
        .skip(skip)
        .limit(limit)
        .exec()
        if (!group) throw new NotFoundException('Group not found');
        
        // Cache the result in Redis
        await this.redisClient.set(memKey,
            JSON.stringify(group.members),
            'EX',
            3600
        )

        return {
            msg: 'Success',
            data: group.members
        }
        }
        catch (error: any) {
            console.error('Error getting all Members in Group', error.message);
            throw new Error('Error getting all Members in Group');
        }
    }

    //   Get all groups a user belongs to
async getAllGroupsByUser(userId: string) {
    try {

        // create key for caching
        const userGroupKey = `userGroups${userId}`

        // query the cache memory
        const cachedGroups = await this.redisClient.get(userGroupKey)
        if (cachedGroups)
            return {
                    msg: 'user groups retrieved successfully',
                    data: JSON.parse(cachedGroups)   
         }
        const groups = await this.groupInfo.find({ 'members.userId': userId });
        if (!groups.length) throw new NotFoundException('User is not a member of any group');
        
        await this.redisClient.set(
            userGroupKey,
            JSON.stringify(groups),
            'EX',
            3600
        )
        return {
            msg: 'Success',
            data: groups
        }
    }
    catch (error: any) {    
        console.error('Error getting all Groups by User', error.message);
        throw new Error('Error getting all Groups by User');
    }
}


//  get all admin in a group 
async getAllAdmins(groupId: string) {
    try {
        // create key f
        const adminKey = `groupAdmins:${groupId}`

        const cachedData = await this.redisClient.get(adminKey)
        if(cachedData)
            return {
                msg: 'data retrieved',
                data: JSON.parse(cachedData)
            }

    // Find the group by groupId
    const group = await this.groupInfo.findOne({ groupId });
    if (!group) throw new NotFoundException('Group not found');


    await this.redisClient.set(
        adminKey,
        JSON.stringify(group),
        'EX',
        3600
    )

    const admins = group.members.filter((member) => member.role === Role.ADMIN);
    return {
        msg: 'Success',
        data: admins
    }
    }
    catch (error: any) {
        console.error('Error getting all Admins in Group', error.message);
        throw new Error('Error getting all Admins in Group');
    }
}


    //   update group details
    async updateGroup(updateGroup: UpdateGroupDetailsDto, userId: string){
        try {

            const { groupId } = updateGroup
            
        const group = await this.groupInfo.findOneAndUpdate(
            { groupId },
            {...CreateGroupDTo },
            { new: true }
        )
        if(!group) throw new NotFoundException('Group not found')   
        
        const isCreator = await this.groupInfo.findOne({ createdBy: userId })
        if(!isCreator) throw new Error('You are not authorized to update this group')

        return {
            msg: 'Group updated successfully',
            data: group
        }
            
        } catch (error) {
            console.error('Error updating Group', error.message)
            throw new Error('Error updating Group')
        }
        
    } 

    async deleteGroup(payload: { groupId: string, userId: string }){
            try {
                
                const group = await this.groupInfo.findOneAndUpdate(
                    { groupId: payload.groupId },
                    {isDeleted: true},
                )
                if(!group) throw new NotFoundException('Group not found')   
                
                const isCreator = group.createdBy === payload.userId
                if(!isCreator) throw new Error('You are not authorized to delete this group')
        
                return {
                    msg: 'Group deleted successfully',
                }

            } catch (error: any) {
                console.error('Error deleting Group', error.message)
                throw new Error('Error deleting Group')
            }
    }

    async getGroupById(groupId: string):Promise<{ msg: string, group: Group}>{
        const group = await this.groupInfo.findOne({ groupId }) 
        if(!group) throw new NotFoundException('Group not found')

        return {
            msg: 'Group found',
            group
        }
    }


    async getGroupByAnyField(params: { key: string, value: string }, query: any):Promise<{ msg: string, data: Group[]}>{    
        const { key, value } = params
        const { skip = 0, limit = 0 } = query

        const result = await this.groupInfo
            .find({ [key]: value, isDeleted: { $ne: true } })
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .exec()
        if (!result.length) {
            throw new NotFoundException(value + ' not found in field ' + key)
        }
        return {
            msg: 'Success',
            data: result
        }
    }

   async getAllGroups(query: any, ):Promise<{ msg: string, data: Group[]}>{

    const groupsKey = `allGroups:${uuidv4}`

    const cachedData = await this.redisClient.get(groupsKey)
    if(cachedData)
        return {
            msg: 'data retrieved from cache memory',
            data: JSON.parse(cachedData)
        }

        const {skip = 0, limit = 0} = query
        try {
            const data = await this.groupInfo
            .find({})
            .skip(skip)
            .limit(limit)
            .lean()
            .exec()
            if(!data.length) throw new NotFoundException()

        await this.redisClient.set(
            groupsKey, JSON.stringify(data), "EX", 3600
        )        
                
            return {
                msg: 'Success',
                data
            }
        } catch (error: any) {
            console.error('Error getting Group', error.message)
            throw new Error('Error getting Group')   
        }
    }
}
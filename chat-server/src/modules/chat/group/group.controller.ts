import { Injectable, Post, Param, Patch, Delete, Get, Body, Query, Controller } from '@nestjs/common'
import { GroupService } from './group.service';
import { CreateGroupDTo } from './dto/create.group.dto';
import { UpdateGroupDetailsDto } from './dto/update.group.details.dto';
import { query } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('Groups')  
@ApiBearerAuth()    
@Controller('group')
export class GroupController {
    constructor( private groupService: GroupService){}

    @Post(':userId')
    @ApiOperation({ summary: 'Create a new group' })
    @ApiBody({ type: CreateGroupDTo })
    @ApiResponse({ status: 201, description: 'Group created successfully' })
    @ApiResponse({ status: 400, description: 'Bad request' })
    async createGroup(
      @Body() createGroupDTo: CreateGroupDTo,
      @Param('userId') userId: string
    ) {
      return this.groupService.createGroup(createGroupDTo, userId);
    }
  
    @Patch(':userId')
    @ApiOperation({ summary: 'Update group details' })
    @ApiParam({ name: 'userId', description: 'ID of the user making the request' })
    @ApiBody({ type: UpdateGroupDetailsDto })
    @ApiResponse({ status: 200, description: 'Group updated successfully' })
    @ApiResponse({ status: 403, description: 'Forbidden (not admin)' })
    async updateGroupDetails(
      @Body() updateGroupDetailsDto: UpdateGroupDetailsDto,
      @Param('userId') userId: string
    ) {
      return this.groupService.updateGroup(updateGroupDetailsDto, userId);
    }
   
    @Delete()
    @ApiOperation({ summary: 'Delete a group' })
    @ApiBody({ 
      schema: {
        type: 'object',
        properties: {
          groupId: { type: 'string', example: 'abc123' },
          userId: { type: 'string', example: 'user456' }
        }
      }
    })
    @ApiResponse({ status: 200, description: 'Group deleted' })
    @ApiResponse({ status: 404, description: 'Group not found' })
    async deleteGroup(@Body() payload: { groupId: string; userId: string }) {
      return this.groupService.deleteGroup(payload);
    }


    @Post('add-member')
@ApiOperation({ summary: 'Add a member to a group' })
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      groupId: { type: 'string', example: 'abc123', description: 'ID of the group' },
      userId: { type: 'string', example: 'user456', description: 'ID of the user to be added' },
      adminId: { type: 'string', example: 'admin789', description: 'ID of the admin performing the action' },
    },
    required: ['groupId', 'userId', 'adminId'],
  },
})
@ApiResponse({ status: 200, description: 'Member added successfully' })
@ApiResponse({ status: 404, description: 'Group or user not found' })
@ApiResponse({ status: 403, description: 'Unauthorized action' })
async addMember(
  @Body() payload: { groupId: string; userId: string; adminId: string }
) {
  return this.groupService.addMemberToGroup(payload);
}


@Patch('remove-member')
@ApiOperation({ summary: 'Remove a member from a group' })
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      groupId: { type: 'string', example: 'abc123', description: 'ID of the group' },
      userId: { type: 'string', example: 'user456', description: 'ID of the user to be removed' },
      adminId: { type: 'string', example: 'admin789', description: 'ID of the admin performing the action' },
    },
    required: ['groupId', 'userId', 'adminId'],
  },
})
@ApiResponse({ status: 200, description: 'Member removed successfully' })
@ApiResponse({ status: 404, description: 'Group or user not found' })
@ApiResponse({ status: 403, description: 'Unauthorized action' })
async removeMember(
  @Body() payload: { groupId: string; userId: string; adminId: string }
) {
  return this.groupService.removeMemberFromGroup(payload);
}

  
    @Get(':groupId')
    @ApiOperation({ summary: 'Get group by ID' })
    @ApiParam({ name: 'groupId', description: 'ID of the group' })
    @ApiResponse({ status: 200, description: 'Group details' })
    async getGroupById(@Param('groupId') groupId: string) {
      return this.groupService.getGroupById(groupId);
    }
  
    @Get('all')
    @ApiOperation({ summary: 'Get all groups (paginated)' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'List of groups' })
    async getAllGroups(@Query() query: any) {
      return this.groupService.getAllGroups(query);
    }
  
    @Get('by-any/:key/:value')
    @ApiOperation({ summary: 'Get groups by any field' })
    @ApiParam({ name: 'key', description: 'Field name (e.g., "name")' })
    @ApiParam({ name: 'value', description: 'Field value to match' })
    @ApiResponse({ status: 200, description: 'Filtered groups' })
    async getGroupByAnyKey(
      @Param() params: { key: string; value: string },
      @Query() query: any
    ) {
      return this.groupService.getGroupByAnyField(params, query);
    }
  
    @Post('make-admin')
    @ApiOperation({ summary: 'Promote member to admin' })
    @ApiBody({
      schema: {
        type: 'object',
        properties: {
          groupId: { type: 'string', example: 'abc123' },
          userId: { type: 'string', example: 'user456' },
          adminId: { type: 'string', example: 'admin789' }
        }
      }
    })
    @ApiResponse({ status: 200, description: 'Member promoted' })
    async makeAdmin(
      @Body() payload: { groupId: string; userId: string; adminId: string }
    ) {
      return this.groupService.makeMemberAdmin(payload);
    }
  
    @Get('members/:groupId')
    @ApiOperation({ summary: 'Get group members (paginated)' })
    @ApiParam({ name: 'groupId', description: 'ID of the group' })
    @ApiQuery({ name: 'skip', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    @ApiResponse({ status: 200, description: 'List of members' })
    async getMembers(
      @Param('groupId') groupId: string,
      @Body() payload: { skip: number; limit: number }
    ) {
      return this.groupService.getAllMembers(groupId, payload.skip, payload.limit);
    }


   @Get('admins/:groupId')
@ApiOperation({ summary: 'Get all admins of a group' })
@ApiParam({ name: 'groupId', description: 'ID of the group', required: true })
@ApiResponse({ status: 200, description: 'List of admins retrieved successfully' })
@ApiResponse({ status: 404, description: 'Group not found' })
async getAdmins(
  @Param('groupId') groupId: string
) {
  return this.groupService.getAllAdmins(groupId);
}

@Get('group/:userId')
@ApiOperation({ summary: 'Get all groups a user belongs to' })
@ApiParam({ name: 'userId', description: 'ID of the user', required: true })
@ApiResponse({ status: 200, description: 'List of groups retrieved successfully' })
@ApiResponse({ status: 404, description: 'User not found or no groups found' })
async getGroupsByUserId(
  @Param('userId') userId: string
) {
  return this.groupService.getAllGroupsByUser(userId);
}

} 
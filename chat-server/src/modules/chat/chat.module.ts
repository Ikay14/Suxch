import { Module,forwardRef } from '@nestjs/common';
import { ChatService } from './chat/chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schema/user.schema';
import { Chat, ChatSchema } from './schema/chat.schema';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { ChatGateway } from './chat/chat.gateway';
import { Group, GroupSchema } from './schema/group.schema';
import {Conversation, ConversationSchema } from './schema/conversation.group.schema';
import { GroupService } from './group/group.service';
import { GroupChatGateWay } from './group/group.gateway';
import { GroupController } from './group/group.controller';
import { WsAuthMiddleware } from 'src/middleware/ws-auth.middleware';
import { UserService } from '../user/user.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Chat.name, schema: ChatSchema },
      { name: Group.name, schema: GroupSchema },
      { name: Conversation.name, schema: ConversationSchema }
    ]),
  ],
  controllers: [GroupController],
  providers: [ChatService, CloudinaryService, ChatGateway, GroupService, GroupChatGateWay, WsAuthMiddleware, UserService],
  exports: [ChatGateway, ChatService,  GroupService, GroupChatGateWay]
})
export class ChatModule {}

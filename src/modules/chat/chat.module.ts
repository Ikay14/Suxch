import { Module,forwardRef } from '@nestjs/common';
import { ChatService } from './chat/chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schema/user.schema';
import { Chat, ChatSchema } from './schema/chat.schema';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { ChatGateway } from './chat/chat.gateway';
import { Group, GroupSchema } from './schema/group.schema';
import { GroupMessage, GroupMessageSchema } from './schema/message.group.schema';
import { GroupService } from './group/group.service';
import { GroupChatGateWay } from './group/group.gateway';
import { GroupController } from './group/group.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Chat.name, schema: ChatSchema },
      { name: Group.name, schema: GroupSchema },
      { name: GroupMessage.name, schema: GroupMessageSchema }
    ]),
  ],
  controllers: [GroupController],
  providers: [ChatService, CloudinaryService, ChatGateway, GroupService, GroupChatGateWay],
  exports: [ChatGateway, ChatService,  GroupService, GroupChatGateWay]
})
export class ChatModule {}

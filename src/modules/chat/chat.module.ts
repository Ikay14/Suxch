import { Module,forwardRef } from '@nestjs/common';
import { ChatService } from './chat/chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schema/user.schema';
import { Chat, ChatSchema } from './schema/chat.schema';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { ChatGateway } from './chat/chat.gateway';
import { Group, GroupSchema } from './schema/group.schema';
import { GroupMessage, GroupMessageSchema } from './schema/message.group.schema';
import { GroupChatService } from './group/group.service';
import { GroupChatGateWay } from './group/group.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Chat.name, schema: ChatSchema },
      { name: Group.name, schema: GroupSchema },
      { name: GroupMessage.name, schema: GroupMessageSchema }
    ]),
  ],

  providers: [ChatService, CloudinaryService, ChatGateway, GroupChatService, GroupChatGateWay],
  exports: [ChatGateway, ChatService,  GroupChatService, GroupChatGateWay]
})
export class ChatModule {}

import { Module,forwardRef } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schema/user.schema';
import { Chat, ChatSchema } from './schema/chat.schema';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { ChatGateway } from './chat.gateway';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Chat.name, schema: ChatSchema }
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, CloudinaryService, ChatGateway],
  exports: [ChatGateway, ChatService]
})
export class ChatModule {}

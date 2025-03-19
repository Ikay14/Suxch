import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../user/schema/user.schema';
import { Chat, ChatSchema } from './schema/chat.schema';
import { CloudinaryService } from 'src/services/cloudinary.service';
import { ChatGateway } from './chat.gateway';
import { RedisModule, RedisModuleOptions } from '@nestjs-modules/ioredis';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Chat.name, schema: ChatSchema }
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, CloudinaryService, ChatGateway]
})
export class ChatModule {}

import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MongooseModule, Schema } from '@nestjs/mongoose';
import { User, UserSchema } from './schema/user.schema';
import { CloudinaryService } from 'src/services/cloudinary.service';
@Module({
imports: [
  MongooseModule.forFeature([
    { name: User.name, schema: UserSchema}
  ]),
],
  controllers: [UserController],
  providers: [UserService, CloudinaryService]
})
export class UserModule {}

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { Document } from 'mongoose';

@Schema({ timestamps: true })
export class GroupMessage extends Document {
  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true })
  group: mongoose.Schema.Types.ObjectId;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  sender: mongoose.Schema.Types.ObjectId;

  @Prop({ required: true })
  groupMsgId: string;

  @Prop({ required: true })
  content: string;

  @Prop({ required: true })
  contentType: string;

  @Prop({ default: 'sent', enum: ['delivered', 'sent', 'read'] }) 
  status: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'GroupMessage', required: false })
  repliesTo?: mongoose.Schema.Types.ObjectId;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({ required: false })
  isDeletedAt?: Date;
}

export const GroupMessageSchema = SchemaFactory.createForClass(GroupMessage);



// {
//     "groupId": "12345" {note a reference to the group},
//     "name": "Developers Group",
//     "description": "A group for developers",
//     "createdBy": "64f1a2b3c4d5e6f7g8h9i0j1{ a user ref}",
//     "avatar": "https://example.com/avatar.jpg",
//     "fileUrl": "https://example.com/file.jpg",
//     "members": [
//       {
//         "userId": "64f1a2b3c4d5e6f7g8h9i0j2",
//         "role": "admin",
//         "joinedAt": "2025-03-26T12:00:00.000Z",
//         "addedBy": "64f1a2b3c4d5e6f7g8h9i0j1"
//       },
//       {
//         "userId": "64f1a2b3c4d5e6f7g8h9i0j3",
//         "role": "member",
//         "joinedAt": "2025-03-26T12:30:00.000Z",
//         "addedBy": "64f1a2b3c4d5e6f7g8h9i0j1"
//       }
//     ],
//     "lastMessage": "Hello, everyone!",
//     "messageCount": 42,
//     "messagePermission": "all",
//     "pinnedMessage": "Welcome to the group!"
//   }



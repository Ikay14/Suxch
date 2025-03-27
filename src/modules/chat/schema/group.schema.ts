import {Schema, Prop, SchemaFactory} from '@nestjs/mongoose'
import mongoose, { Document } from 'mongoose'

export enum Role {
    ADMIN = 'admin',
    MEMBER = 'member'
}


@Schema({ timestamps: true })
export class Group extends Document {

    @Prop()
    groupId: string

    @Prop()
    name: string

    @Prop()
    description: string

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User' })
    createdBy: string

    @Prop()
    avatar: string

    @Prop()
    fileUrl: string

    @Prop([
        {
          userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
          role: { type: String, enum: Role },
          joinedAt: { type: Date, default: Date.now },
          addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        },
      ])
      members: Array<{
        userId: mongoose.Schema.Types.ObjectId;
        role: Role;
        joinedAt: Date;
        addedBy: mongoose.Schema.Types.ObjectId;
      }>;

    @Prop()
    lastMessage: string

    @Prop()
    messageCount: Number

    @Prop()
    messagePermission: string

    @Prop()
    pinnedMessage: string


}

export const GroupSchema = SchemaFactory.createForClass(Group)


// {
//     "group": "64f1a2b3c4d5e6f7g8h9i0j1",
//     "sender": "64f1a2b3c4d5e6f7g8h9i0j2",
//     "groupMsgId": "12345",
//     "content": "Hello, group!",
//     "contentType": "text",
//     "status": "sent",
//     "repliesTo": null,
//     "isDeleted": false,
//     "isDeletedAt": null,
//     "createdAt": "2025-03-26T12:00:00.000Z",
//     "updatedAt": "2025-03-26T12:00:00.000Z"
//   }
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
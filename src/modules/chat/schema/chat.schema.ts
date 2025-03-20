import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";
import { UUID } from "crypto";
import mongoose, { Document, Types } from "mongoose";

export enum MessageStatus {
    SENT = 'sent',
    DELIVERED = 'delivered',
    READ = 'read'
  }
  
  export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio'
  }

@Schema({ timestamps: true })
export class Chat extends Document {

    @Prop({  })
    messageId: UUID;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User',  })
    senderId: Types.ObjectId;
  
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User',  })
    receiverId: Types.ObjectId;
  
    @Prop({ default: false })
    isRead: boolean;
  
    @Prop({ type: String, enum: MessageStatus, default: MessageStatus.SENT })
    status: MessageStatus;
    
    @Prop()
    content: string; // For text messages

    @Prop()
    fileUrl: string; // For media messages (image, video, audio)
  
    @Prop({ type: String, enum: MessageType, default: MessageType.TEXT })
    messageType: MessageType;
  
    @Prop({ default: false })
    isDeleted: boolean;

    @Prop()
    isDeletedAt: Date;

}

export const ChatSchema = SchemaFactory.createForClass(Chat)
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class Chat extends Document {
  @Prop({ default: uuidv4, unique: true })
  messageId: string; // UUID for message identification

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  sender: Types.ObjectId; // Reference to sender user

  @Prop({ type: Types.ObjectId, ref: 'receiverType' })
  receiver: Types.ObjectId; // Can be user or group

  @Prop({ enum: ['User', 'Group'], required: true })
  receiverType: string; // Determines if message is to user or group

  @Prop()
  content: string; // Text content of message

  @Prop()
  fileUrl: string; // URL if message contains file

  @Prop()
  fileType: string; // Type of file (image, video, etc.)

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  replyTo: Types.ObjectId; // Reference to replied message

  @Prop({ default: false })
  isDeleted: boolean; // Soft delete flag

  @Prop({ type: [{ userId: Types.ObjectId, readAt: Date }], default: [] })
  readReceipts: { userId: Types.ObjectId, readAt: Date }[]; // Track who read the message

  @Prop({ default: 'delivered' })
  status: 'sent' | 'delivered' | 'read'; // Message status
}

export const ChatSchema = SchemaFactory.createForClass(Chat);
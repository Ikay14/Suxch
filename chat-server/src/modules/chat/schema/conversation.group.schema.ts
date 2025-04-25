import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

@Schema({ timestamps: true })
export class Conversation extends Document {
  @Prop({ default: uuidv4, unique: true })
  conversationId: string; // UUID for conversation

  @Prop({ default: uuidv4 })
  roomId: string; // Unique room identifier for chat/group conversations

  @Prop({ type: [{ type: Types.ObjectId, ref: 'User' }] })
  participants: Types.ObjectId[]; 

  @Prop({ type: Types.ObjectId, ref: 'Message' })
  lastMessage: Types.ObjectId; // Reference to last message

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isGroup: boolean; // Flag for group conversations
}

export const ConversationSchema = SchemaFactory.createForClass(Conversation);
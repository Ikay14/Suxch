import { IsUUID,IsNotEmpty, IsString,IsOptional } from "class-validator";

export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio'
  }


export class CreateMsgDto {

    senderId: string
    
    receiverId: string

    chatId: string

    content: string

    messageType: MessageType

    replyTo: string  
} 
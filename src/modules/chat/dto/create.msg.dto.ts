import { IsUUID,IsNotEmpty, IsString,IsOptional } from "class-validator";

export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio'
  }


export class CreateMsgDto {

    @IsNotEmpty()
    senderId: string
    
    @IsNotEmpty()
    receiverId: string

    @IsUUID()
    chatId: string

    @IsString()
    @IsNotEmpty()
    content: string

    @IsString()
    @IsNotEmpty()
    messageType: MessageType

    @IsOptional()
    @IsString()
    replyToMsg: string
}
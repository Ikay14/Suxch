import { IsUUID,IsNotEmpty, IsString,IsOptional } from "class-validator";

export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio'
  }


export class UploadMsgMediaDto {

    @IsNotEmpty()
    senderId: string
    
    @IsNotEmpty()
    receiverId: string

    @IsUUID()
    @IsNotEmpty()
    msgId: string

    @IsString()
    @IsNotEmpty()
    contentType: MessageType

    @IsOptional()
    @IsString()
    replyToMsg: string
}
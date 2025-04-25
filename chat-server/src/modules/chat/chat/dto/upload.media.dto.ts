import { IsUUID,IsNotEmpty, IsString,IsOptional } from "class-validator";

export enum MessageType {
    TEXT = 'text',
    IMAGE = 'image',
    VIDEO = 'video',
    AUDIO = 'audio',
    DOCUMENT = 'document'
  }


export class UploadMsgMediaDto {

    @IsNotEmpty()
    senderId: string
    
    @IsNotEmpty()
    receiverId: string

    @IsUUID()
    roomId: string

    @IsString()
    file: string

    @IsString()
    @IsNotEmpty()
    contentType: MessageType

    @IsOptional()
    @IsString()
    replyToMsg: string
}
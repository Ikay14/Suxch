import { IsUUID,IsNotEmpty, IsString,IsOptional } from "class-validator";

export class CreateMsgDto {

    @IsNotEmpty()
    senderId: string
    
    @IsNotEmpty()
    receiverId: string

    @IsUUID()
    @IsNotEmpty()
    chatId: string

    @IsString()
    @IsNotEmpty()
    content: string

    @IsOptional()
    @IsString()
    replyToMsg: string
}
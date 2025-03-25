import { IsUUID,IsNotEmpty, IsString,IsOptional } from "class-validator";

export class TypingDto {
    
    @IsNotEmpty()
    receiverId: string

    @IsNotEmpty()
    senderId: string

    chatId: string

}
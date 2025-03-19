import { IsNotEmpty, IsString,IsOptional } from "class-validator";

export class StopTypingDto {
    
    @IsNotEmpty()
    receiverId: string

    @IsNotEmpty()
    senderId: string

}
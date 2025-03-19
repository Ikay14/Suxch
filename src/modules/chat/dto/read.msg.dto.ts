import { IsUUID,IsNotEmpty, IsString,IsOptional } from "class-validator";

export class ReadReceiptDto {
    
    @IsNotEmpty()
    receiverId: string

    @IsUUID()
    @IsNotEmpty()
    messageId: string

}
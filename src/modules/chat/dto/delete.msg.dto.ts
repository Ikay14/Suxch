import { IsUUID,IsNotEmpty, IsString,IsOptional } from "class-validator";

export class DeleteMsgDto {
    
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsNotEmpty()
    messageId: string

}
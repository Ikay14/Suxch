import { IsUUID,IsNotEmpty, IsString,IsOptional } from "class-validator";

export class UpdateMsgDto {
   
    @IsNotEmpty()
    userId: string

    @IsUUID()
    @IsNotEmpty()
    messageId: string


    @IsString()
    @IsNotEmpty()
    newContent: string

}
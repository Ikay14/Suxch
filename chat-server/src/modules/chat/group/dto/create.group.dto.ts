import { IsString } from "class-validator";

export class CreateGroupDTo {
   @IsString()
    name: string 

    @IsString()
    description

    groupId: string 
}  


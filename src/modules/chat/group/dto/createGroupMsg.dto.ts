import { Prop } from "@nestjs/mongoose";

export class CreateGroupDTo {
    @Prop()
    name: string 

    @Prop()
    description

    @Prop()
    groupId: string 

    @Prop()
    createdBy: string
}
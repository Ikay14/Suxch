import { PartialType } from "@nestjs/mapped-types";
import { CreateGroupDTo } from "./create.group.dto";

export class UpdateGroupDetailsDto extends PartialType(CreateGroupDTo) {}
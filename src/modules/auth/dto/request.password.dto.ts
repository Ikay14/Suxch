import { IsEmail } from "class-validator";

export class RequestChangePasswordDto {

    @IsEmail()
    email: string
}

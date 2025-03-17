import { IsEmail, IsPhoneNumber, IsString } from "class-validator";

export class RegisterUserDto {
    @IsString()
    fullname: string

    @IsEmail()
    email: string

    @IsString()
    password: string

    @IsPhoneNumber()
    tel: string

}
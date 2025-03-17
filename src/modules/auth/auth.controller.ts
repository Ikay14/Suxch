import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterUserDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { skipAuth } from 'src/guard/custom.guard';
import { ApiTags } from '@nestjs/swagger';
import { RequestChangePasswordDto } from './dto/request.password.dto';
import { ForgetPasswordDto } from './dto/change.password.dto';

@skipAuth()
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
    constructor(
       private authService : AuthService
    ){}

    @Post('register')
    async registerUser(
        @Body() registerUserDto: RegisterUserDto){
        return await this.authService.registerUser(registerUserDto)
    }

    @Post('login')
    async login(
        @Body() loginDto:LoginDto,
        @Res() res: Response
    ){
        return this.authService.login(loginDto, res)
    }

    @Post('request_password')
    async requestPasswordChange(
        @Body() requestPassword: RequestChangePasswordDto
    ){
        return this.authService.requestChangePassword(requestPassword)
    }

    @Post('change_password')
    async changePassword(
        @Body() changePasswordDto: ForgetPasswordDto
    ){
        return this.authService.changePassword(changePasswordDto)
    }
}

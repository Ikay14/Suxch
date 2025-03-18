import { Injectable, Inject, BadRequestException, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { Response as ExpressResponse } from 'express';
import { User } from '../user/schema/user.schema';
import { InjectModel } from '@nestjs/mongoose'; 
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { RegisterUserDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Response } from 'express';
import * as bcrypt from 'bcrypt'
import { MailService } from 'src/services/email';
import { generateResponsePayload } from 'src/helpers/generate.payload';
import { generateOTP } from 'src/helpers/generate.otp';
import { RequestChangePasswordDto } from './dto/request.password.dto';
import { ForgetPasswordDto } from './dto/change.password.dto';


@Injectable()
export class AuthService {
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        private configService: ConfigService,
        private jwtService: JwtService,
        private mailService: MailService
    ) {}

    async registerUser(registerUser:RegisterUserDto):Promise<any>{
        const { email, password } = registerUser
        const user = await this.userModel.findOne({ email })
        if(user) throw new BadRequestException('User Exits, Please Proceed to login')

        const verificationOtp = generateOTP()   

        const hashPassword = await bcrypt.hash(password, 10)
        const hashedOtp = await bcrypt.hash(verificationOtp, 10)

            // OTP expiry time (10 minutes)
        const otpExpires = new Date(Date.now() + 10 * 60 * 1000)

        const newUser = await new this.userModel({
            ...registerUser,
            password: hashPassword,
            otp: hashedOtp,
            otpExpires
        })

        const accessToken = this.generateAccessToken(newUser)
        const responsePayload = generateResponsePayload(newUser)
        

        await this.sendEmail(
            email,
            'Welcome to Suxch ChatApp',
            'welcome',
            { name: newUser.fullname, email: newUser.email, verificationOtp }
        )

        await newUser.save()
        
        return {
            msg: 'User created',
            responsePayload,
            accessToken
        }
    }

     async login(loginDto: LoginDto, res: Response):Promise<any>{
        const {email, password } = loginDto

        const user = await this.userModel.findOne({ email })
        if(!user) throw new NotFoundException('User not Found')

        const isMatch = await bcrypt.compare(password, user.password)
        if(!isMatch) throw new BadRequestException('User entered credentials invalid')

        const accessToken = this.generateAccessToken(user)
        const responsePayload = generateResponsePayload(user) 

        const isDevelopment = process.env.NODE_ENV === 'production';

        await res.cookie('accessToken', accessToken, {
            httpOnly: true,       
            secure: !isDevelopment,         
            sameSite: 'strict',  
            maxAge: 7 * 24 * 60 * 60 * 1000,    
          });
        
        return {
            msg: 'Login successful',
            responsePayload,
            accessToken
        }
    } 

   async requestChangePassword(requestChangePasswordDto:RequestChangePasswordDto ){
    const { email } = requestChangePasswordDto

    const user = await this.userModel.findOne({ email })
    if(!user) throw new NotFoundException('user not found')

    const verificationOtp = generateOTP() 
    
    const hashedOtp = await bcrypt.hash(verificationOtp, 10)

    // OTP expiry time (10 minutes)
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000)

    user.otp = hashedOtp
    user.otpExpires = otpExpires
    await user.save()

    await this.sendEmail(
        email,
        'Password Reset Request',
        'password.reset',
        { name: user.fullname, email: user.email, verificationOtp }
    )  
    
    return {
        msg: "password reset"
    }
   }

   async changePassword(changePasswordDto: ForgetPasswordDto) {
    const { email, otp, newPassword } = changePasswordDto;

    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('User not found');

    if (!user.otpExpires || new Date() > user.otpExpires) {
        throw new BadRequestException('OTP expired');
    }

    // Validate OTP
    const isValidOtp = await bcrypt.compare(otp, user.otp);
    if (!isValidOtp) throw new BadRequestException('Invalid OTP');

    // Hash and update new password
    user.password = await bcrypt.hash(newPassword, 10);

    // Clear OTP fields after successful reset
    user.otp = null;
    user.otpExpires = null;
    await user.save();

    // Send confirmation email
    await this.sendEmail(email, 'Password Changed Successfully', 'change.password', { name: user.fullname, email: email });

    return { message: 'Password changed successfully' };
}

async verifyOtp(email: string, otp: string) {
    if (typeof email !== 'string' || typeof otp !== 'string') {
        throw new BadRequestException('Invalid input');
    }

    const user = await this.userModel.findOne({ email });
    if (!user) throw new NotFoundException('User not found');

    if (!user.otp || !user.otpExpires || new Date() > user.otpExpires) 
        throw new BadRequestException('OTP expired or invalid');
    

    const isValidOtp = await bcrypt.compare(otp, user.otp);
    if (!isValidOtp) throw new BadRequestException('Invalid OTP');

    user.isVerified = true; 
    user.otp = null;
    user.otpExpires = null;  
    await user.save();

    return { message: 'OTP verified successfully' };
}


async refreshToken(token: string) {
    try {
        const payload = this.jwtService.verify(token);
        if (!payload || !payload.sub) throw new UnauthorizedException('Invalid refresh token');

        const user = await this.userModel.findById(payload.sub);
        if (!user) throw new UnauthorizedException('User not found');

        // Generate a new access token
        const newAccessToken = this.generateAccessToken(user);

        return {
            access_token: newAccessToken,
            refresh_token: token, // Return the same refresh token
        };
    } catch (error) {
        throw new UnauthorizedException('Invalid or expired refresh token');
    }
}


   // sendMail method
private async sendEmail(to: string, subject: string, templateName: string, data: Record<string, string> ): Promise<void> {
    await this.mailService.sendMailWithTemplate(to, subject, templateName, data);
}


 // Centralized method to generate access token
 generateAccessToken(user: User): string { 
    const payload = {
      id: user._id,  
      email: user.email
    };
  
    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET,
      expiresIn: '30d', 
    });
  }
}

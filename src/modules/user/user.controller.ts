import { Body, Controller, Delete, Get, Param, Post, Query, UploadedFile, UseInterceptors } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from '../auth/dto/register.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/common/multer.storage';

@Controller('user')
export class UserController {
    constructor(
        private userService: UserService
    ){}

    @Post()
    async upsetUser(
        @Body() registerUserDto:RegisterUserDto) {
        return this.userService.upsetUser(registerUserDto)   
    }

    @Post('upload')
    @UseInterceptors(FileInterceptor('file', multerOptions))
    uploadFile(
        @UploadedFile() file: Express.Request['file'],
        @Param('userId') userId: string
    ) {
        console.log(file);
        return this.userService.uploadProfilePicture(file, userId)  
    }

    @Delete('profile')
    async deleteProfile(
       @Body() imageUrl: string,  
       @Param('userId') userId: string
    ){
        return this.userService.deleteProfilePicture(imageUrl, userId)
    }

    @Get('userId')
    async getUserById(
        @Param('userId') userId: string
    ){
        return this.getUserById(userId)
    }

    @Get('query')
    async getUserByAnyKey(
        @Param() params: { key: string; value: string },
        @Query() query: any
    ){
        return this.userService.findByAny(params, query)
    }

    @Get('query/all')
    async queyAll(
        @Query() query: any
    ){
        return this.userService.findAll(query)
    }

    @Delete('query/all')
    async deleteUser(
        @Query() query: any
    ){
        return this.userService.findAll(query)
    }


}

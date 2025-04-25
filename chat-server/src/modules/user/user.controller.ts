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

    @Post('upload/:userId')
    @UseInterceptors(FileInterceptor('file', multerOptions))
    uploadFile(
        @UploadedFile() file: Express.Request['file'],
        @Param('userId') userId: string
    ) {
        return this.userService.uploadProfilePicture(file, userId)  
    }

    @Delete('profile/:userId')
    async deleteProfile(
       @Body() imageUrl: string,  
       @Param('userId') userId: string
    ){
        return this.userService.deleteProfilePicture(imageUrl, userId)
    }

    @Get(':userId')
    async getUserById(
        @Param('userId') userId: string
    ){
        return this.userService.getUserById(userId)
    }

    @Get('by-any/:key/:value') 
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

    @Delete(':userId')
    async deleteUser(
        @Query() query: any 
    ){
        return this.userService.findAll(query)
    }


}

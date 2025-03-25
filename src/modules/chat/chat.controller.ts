import { Controller, Post, Delete, Body, Param, Patch, Get, UploadedFile, UseInterceptors, Query } from '@nestjs/common';
import { ChatService } from './chat.service';

import { CreateMsgDto } from './dto/create.msg.dto';
import { UpdateMsgDto } from './dto/update.msg.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { multerOptions } from 'src/common/multer.storage';
import { UploadMsgMediaDto } from './dto/upload.media.dto';

@Controller('chat')
export class ChatController {
    constructor(
      private  chatService: ChatService
    ){}

    @Post()
    async createMsg(
        @Body() createChatDto: CreateMsgDto
    ){
        return this.chatService.createMessage(createChatDto)
    }

    @Post('media')
    @UseInterceptors(FileInterceptor('file', multerOptions))
        UploadFiles(
            @Body() data: UploadMsgMediaDto,
            @UploadedFile() file : Express.Request['file'],
         ) {
            return this.chatService.uploadFile(data, file)
    }

    @Get(':userId')
    async getUserChat(
        @Param('userId') userId: string,
        @Query('skip') skip: number = 0,
        @Query('limit') limit: number = 20   
 ){
        return this.chatService.getUserChats(userId, skip, limit)
    }

    @Get('chatId')
    async getByChatId(@Param('chatId') chatId: string){
        return this.chatService.getChatById(chatId)
    }

    @Patch(':msgId')
    async updateMSg(
        @Body() data: UpdateMsgDto
    ){
        return this.chatService.updateUserMsg(data)
    }

    @Delete(':chatId')
    async delChat(@Param('chatId') chatId: string){
        return this.chatService.delChatById(chatId)
    }

    @Delete(':msgId')
    async delMsgById(@Param('msgId') msgId: string){
        return this.chatService.delMsgById(msgId)
    }

}

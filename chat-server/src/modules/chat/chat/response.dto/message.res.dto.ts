import { Exclude, Expose } from 'class-transformer';

export class MessageDto {
    @Expose()
    _id: string;

    @Expose()
    senderId: string;

    @Expose()
    receiverId: string;

    @Expose()
    content: string;

    @Expose()
    fileUrl: string;

    @Expose()
    messageType: string;

    @Expose()
    createdAt: Date;

    @Expose()
    updatedAt: Date;
}
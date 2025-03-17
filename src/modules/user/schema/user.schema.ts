import { Document } from "mongoose";
import { Schema, Prop, SchemaFactory } from "@nestjs/mongoose";


@Schema({ timestamps: true })
export class User extends Document {
    @Prop()
    email: string

    @Prop()
    username: string

    @Prop()
    password: string

    @Prop()
    avatar: string

    @Prop()
    bio:string

    @Prop()
    tel: string

    @Prop()
    fullname: string

    @Prop({ default: false })
     isVerified: boolean;

    @Prop({ default: Date.now })
    lastActive: Date;

    @Prop({ enum: ['online', 'offline', 'busy', 'away'], default: 'offline' })
    status: string;

    @Prop({ type: [String], default: [] })
    blockedUsers: string[];

    @Prop({ type: [String], default: [] })
    contacts: string[];

    @Prop({ type: [String], default: [] })
    groups: string[];

    @Prop({ default: 0 })
    unreadMessagesCount: number;

    @Prop()
    lastMessage?: string;

    @Prop()
    otp?: string;

    @Prop()
    otpExpires?: Date

    @Prop({
    type: {
      messageNotifications: { type: Boolean, default: true },
      sound: { type: Boolean, default: true },
    },
    })
    notificationSettings: Record<string, any>;

    @Prop()
    @Prop({ default: null }) // Nullable field for soft delete tracking
    deletedAt?: Date;

    
}


export const UserSchema = SchemaFactory.createForClass(User)
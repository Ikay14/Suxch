import { UseFilters } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { CustomWsExceptionFilter } from "src/common/ws-exception.filter";
import { Group } from "../schema/group.schema";
import { Model } from "mongoose";
import { Conversation } from "../schema/conversation.group.schema";
import { GroupService } from "./group.service";

@WebSocketGateway({ namespace : 'group_chat' })
@UseFilters(new CustomWsExceptionFilter())
export class GroupChatGateWay implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private groupService : GroupService,
        @InjectModel(Group.name) private groupInfo: Model<Group>,
        @InjectModel(Conversation.name) private conversation: Model<Conversation>,
    ){console.log('GroupChatGateway initialized')}
    
    @WebSocketServer() server: Server

    handleConnection(client: Socket) {
        console.log(`Client connected: ${client.id}`);
        const userId = client.handshake.query.userId;
        if (userId) {
            client.join(userId); // Join user-specific Group
        }
    }
          
    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
        const userId = client.handshake.query.userId;
        if (userId) {
            if (typeof userId === 'string') {
                client.leave(userId);
            }
        }
    }
}
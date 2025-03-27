import { UseFilters } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { OnGatewayConnection, OnGatewayDisconnect, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { WsExceptionFilter } from "src/common/ws-exception.filter";
import { Group } from "../schema/group.schema";
import { Model } from "mongoose";
import { GroupMessage } from "../schema/message.group.schema";
import { GroupChatService } from "./group.service";

@WebSocketGateway({ namespace : 'group_chat' })
@UseFilters( new WsExceptionFilter())

export class GroupChatGateWay implements OnGatewayConnection, OnGatewayDisconnect {
    constructor(
        private groupChatService : GroupChatService,
        @InjectModel(Group.name) private groupInfo: Model<Group>,
        @InjectModel(GroupMessage.name) private groupMsg: Model<GroupMessage>,

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
          
            // Remove user from rooms
            const userId = client.handshake.query.userId;
            if (userId) {
              if (typeof userId === 'string') {
                client.leave(userId);
              }
            }
          }
    
}
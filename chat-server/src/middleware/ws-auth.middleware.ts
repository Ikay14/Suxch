import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AuthenticatedSocket } from 'src/modules/chat/interface/authenticated';

@Injectable()
export class WsAuthMiddleware {
  constructor(
    private jwtService: JwtService,
    private configService: ConfigService
  ) {}

  use(socket: AuthenticatedSocket, next: (err?: Error) => void) {
    try {
      const token = socket.handshake.auth.token ||
                    socket.handshake.headers.authorization?.split(' ')[1];

      if (!token) {
        return next(new Error('Unauthorized'));
      }

      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      if (!payload?.id) {
        return next(new Error('Invalid token payload'));
      }

      socket.userId = payload.id;
      socket.fullName = payload.fullName;

      return next();
    } catch (error) {
      return next(new Error('Authentication failed'));
    }
  }
}

// ws-exception.filter.ts
import { Catch } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { ArgumentsHost } from '@nestjs/common';

@Catch()
export class WsExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToWs();
    const client = ctx.getClient();
    
    const error = exception instanceof Error 
      ? { message: exception.message }
      : { message: 'An unexpected error occurred' };

    client.emit('error', error);
  }
}
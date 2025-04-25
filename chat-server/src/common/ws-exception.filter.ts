import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Catch()
export class CustomWsExceptionFilter implements ExceptionFilter {
    catch(exception: unknown, host: ArgumentsHost) {
        const client = host.switchToWs().getClient();

        if (exception instanceof WsException) {
            const error = exception.getError();
            const details = typeof error === 'string' ? { message: error } : error;
            client.emit('error', { status: 'error', ...details });
        } else if (exception instanceof Error) {
            client.emit('error', { status: 'error', message: exception.message });
        } else {
            client.emit('error', { status: 'error', message: 'An unknown error occurred' });
        }
    }
}
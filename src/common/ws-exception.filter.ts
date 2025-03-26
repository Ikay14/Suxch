import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

@Catch(WsException, HttpException)
export class WsExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(WsExceptionFilter.name);

  catch(exception: WsException | HttpException, host: ArgumentsHost) {
    const client = host.switchToWs().getClient();
    const data = host.switchToWs().getData();

    let errorResponse: any;

    if (exception instanceof WsException) {
      errorResponse = {
        status: 'error',
        message: exception.message,
      };
    } else if (exception instanceof HttpException) {
      const response = exception.getResponse();
      errorResponse = {
        status: 'error',
        message: typeof response === 'string' ? response : (response as any).message,
      };
    } else {
      errorResponse = {
        status: 'error',
        message: 'An unknown error occurred',
      };
    }

    this.logger.error(`Exception: ${JSON.stringify(errorResponse)}`, exception.stack);

    // Emit the error to the client
    client.emit('exception', errorResponse);
  }
}
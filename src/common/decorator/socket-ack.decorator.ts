import { createParamDecorator } from '@nestjs/common';

export const SocketAck = createParamDecorator((_, ctx) => {
  const client = ctx.switchToWs().getClient();
  return (response: any) => {
    client.emit('ack', response); // Custom ack event
  };
});
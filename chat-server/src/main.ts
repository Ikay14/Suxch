
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from 'nestjs-pino';
import { NestExpressApplication } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import * as fs from 'fs'; 
import * as cors from 'cors';
import * as cookieParser from 'cookie-parser';
import { client, initializeDatabase } from './db/data.source';
import { ConfigService } from '@nestjs/config';
import { Parser } from '@asyncapi/parser';




async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  // MongoDB connection
  try {
    await initializeDatabase();
    console.log('MongoBD has been initialized!');
  } catch (err) {
    console.error('Error during MongoDB initialization', err);
    process.exit(1);
  }

  // Redis Connection
   try {
      await client.connect();
      console.log('Redis has been initialized');
      
      // Test Redis connection
      await client.set('foo', 'bar');
      const result = await client.get('foo');
      console.log('Test value from Redis:', result);
    } catch (err) {
      console.error('Error during Redis initialization:', err);
      process.exit(1);
  }

  const logger = app.get(Logger);
  
  app.enable('trust proxy');
  // app.useLogger(logger);
  app.useGlobalPipes(new ValidationPipe({ transform: true }));
  
  app.setGlobalPrefix('api/v1', { exclude: ['api', 'api/v1', 'api/docs',] }); 

   // Serve Swagger
   const config = new DocumentBuilder()
   .setTitle('Suxch API')
   .setDescription('The API documentation')
   .setVersion('1.0')   
   .addBearerAuth()
   .build();    

  const asyncapiDocument = fs.readFileSync('./asyncapi.yaml', 'utf8');
  const parser = new Parser();
  parser.parse(asyncapiDocument)
    .then((doc) => console.log('Valid AsyncAPI document:'))
    .catch((err) => console.error('Invalid AsyncAPI document:', err));

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  fs.writeFileSync('./swagger.json', JSON.stringify(document, null, 2));
   
  // // Add WebSocket adapter
  // app.useWebSocketAdapter(new IoAdapter(app));

  app.use(cookieParser());
  
  
  app.enableCors({
    origin: 'http://localhost:3000',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  const port = app.get<ConfigService>(ConfigService).get<number>('server.port');

  await app.listen(port); 
  console.log(`Swagger is running at http://localhost:${port}/api/docs`);

  logger.log({ message: 'server started!', port, url: `http://localhost:${port}/api/v1` });

} 

bootstrap().catch(err => {
  console.error('Error during bootstrap', err);
  process.exit(1);
});


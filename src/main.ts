import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

async function bootstrap() {
 const logger = new Logger();
 const app = await NestFactory.create(AppModule);
 const configService = app.get(ConfigService);
 
 const port = configService.get('PORT');
 const devFrontendUrl = configService.get('DEV_FRONTEND_URL');
 const localFrontendUrl = configService.get('LOCAL_FRONTEND_URL');
 
 app.enableCors({
   origin: [devFrontendUrl, localFrontendUrl],
   methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
   credentials: true,
 });
 
 await app.listen(port);
 logger.log(`\n\nApplication is running on port: ${port}\n`);
 logger.log(`\n\nAllowed origins: ${devFrontendUrl}, ${localFrontendUrl}\n`);
}
bootstrap();
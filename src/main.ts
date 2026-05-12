import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import helmet from 'helmet';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { contentSecurityPolicy } from 'helmet';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        // fontSrc: ["'self'"],
        // connectSrc: ["'self'"],
        // frameSrc: ["'none'"],
        // objectSrc: ["'none'"],
        // mediaSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false, // Desabilita o COEP para evitar bloqueios de recursos externos
    hsts: { //Obriga o usuário a usar HTTPS
      maxAge: 31536000, // 1 ano
      includeSubDomains: true,
      preload: true, // adiciona o domínio à lista de pré-carregamento do HSTS dos navegadores
    },
  })
  );

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);

      const allowedOrigins = process.env.CORS_ORIGIN?.split(',') || ['*'];

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-Requested-With',
      'Accept',
      'Origin',
      'Access-Control-Request-Method',
      'Access-Control-Request-Headers'
    ],
    credentials: true,
    maxAge: 86400, // 24 hours
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Marketplace API Gateway')
    .setDescription('API Gateway for the Marketplace Microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT || 3005;
  await app.listen(port);
  console.log(`API Gateway is running on port ${port}`);
  console.log(`Swagger docs available at http://localhost:${port}/api`);
}

bootstrap();

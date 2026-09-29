import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CodesService } from './codes.service';
import { MailService } from './mail.service';
import { TokensService } from './tokens.service';

@Module({
  imports: [JwtModule.register({})],
  controllers: [AuthController],
  providers: [AuthService, CodesService, TokensService, MailService],
  exports: [AuthService, TokensService],
})
export class AuthModule {}

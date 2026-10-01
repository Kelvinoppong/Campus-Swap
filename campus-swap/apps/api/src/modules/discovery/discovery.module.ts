import { Module } from '@nestjs/common';

import { ClipService } from './clip.service';
import { DiscoveryController } from './discovery.controller';
import { DiscoveryService } from './discovery.service';

@Module({
  controllers: [DiscoveryController],
  providers: [ClipService, DiscoveryService],
  exports: [DiscoveryService],
})
export class DiscoveryModule {}

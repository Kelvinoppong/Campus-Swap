import {
  similarListingsQuerySchema,
  visualSearchQuerySchema,
  type SimilarListingsQuery,
  type VisualSearchQuery,
  type VisualSearchResponse,
} from '@campus-swap/shared';
import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';

import {
  CurrentUser as CurrentUserParam,
  type RequestUser,
} from '../../common/auth/auth.decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

import { DiscoveryService } from './discovery.service';

@Controller()
export class DiscoveryController {
  constructor(private readonly discovery: DiscoveryService) {}

  /** "More like this" on the listing screen: image to image. */
  @Get('listings/:id/similar')
  async similar(
    @Param('id', ParseUUIDPipe) id: string,
    @Query(new ZodValidationPipe(similarListingsQuerySchema)) query: SimilarListingsQuery,
    @CurrentUserParam() user: RequestUser,
  ): Promise<VisualSearchResponse> {
    const items = await this.discovery.similarTo(id, user, query.limit);
    return { items };
  }

  /** Plain-English search against the photo index: text to image. */
  @Get('discovery/search')
  async search(
    @Query(new ZodValidationPipe(visualSearchQuerySchema)) query: VisualSearchQuery,
    @CurrentUserParam() user: RequestUser,
  ): Promise<VisualSearchResponse> {
    const items = await this.discovery.searchByText(query.q, user, query.limit);
    return { items };
  }
}

import {
  createListingSchema,
  listingQuerySchema,
  updateListingSchema,
  type CreateListingInput,
  type CursorPage,
  type Listing as ListingDto,
  type ListingQuery,
  type UpdateListingInput,
} from '@campus-swap/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';

import { CurrentUser as CurrentUserParam, type RequestUser } from '../../common/auth/auth.decorators';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

import { ListingsService } from './listings.service';

@Controller('listings')
export class ListingsController {
  constructor(private readonly listings: ListingsService) {}

  @Get()
  async browse(
    @Query(new ZodValidationPipe(listingQuerySchema)) query: ListingQuery,
    @CurrentUserParam() user: RequestUser,
  ): Promise<CursorPage<ListingDto>> {
    return this.listings.browse(query, user);
  }

  @Get(':id')
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserParam() user: RequestUser,
  ): Promise<ListingDto> {
    return this.listings.findOne(id, user);
  }

  @Post()
  async create(
    @Body(new ZodValidationPipe(createListingSchema)) body: CreateListingInput,
    @CurrentUserParam() user: RequestUser,
  ): Promise<ListingDto> {
    return this.listings.create(body, user);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(new ZodValidationPipe(updateListingSchema)) body: UpdateListingInput,
    @CurrentUserParam() user: RequestUser,
  ): Promise<ListingDto> {
    return this.listings.update(id, body, user);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserParam() user: RequestUser,
  ): Promise<void> {
    await this.listings.remove(id, user.id);
  }

  /** Save and unsign are idempotent, so they are PUT and DELETE rather than a toggle. */
  @Put(':id/save')
  async save(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserParam() user: RequestUser,
  ): Promise<{ saved: boolean }> {
    return this.listings.setSaved(id, user.id, true);
  }

  @Delete(':id/save')
  async unsave(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUserParam() user: RequestUser,
  ): Promise<{ saved: boolean }> {
    return this.listings.setSaved(id, user.id, false);
  }
}

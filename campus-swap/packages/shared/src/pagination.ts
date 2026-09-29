import { z } from 'zod';

/**
 * Every list endpoint is cursor-paginated. The cursor is opaque to the client:
 * hand back whatever `nextCursor` you were given to fetch the next page.
 */
export const cursorPageQuerySchema = z.object({
  cursor: z.string().min(1).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
export type CursorPageQuery = z.infer<typeof cursorPageQuerySchema>;

export interface CursorPage<T> {
  items: T[];
  nextCursor: string | null;
}

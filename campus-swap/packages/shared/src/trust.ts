import { z } from 'zod';
import { publicUserSchema } from './auth';
import { LIMITS, REPORT_REASONS, REPORT_STATUSES, REPORT_TARGET_TYPES } from './constants';
import { cursorPageQuerySchema } from './pagination';

export const createReviewSchema = z.object({
  listingId: z.uuid(),
  stars: z.number().int().min(1).max(5),
  comment: z.string().trim().max(LIMITS.reviewCommentMax).optional(),
});
export type CreateReviewInput = z.infer<typeof createReviewSchema>;

export const reviewSchema = z.object({
  id: z.uuid(),
  stars: z.number().int(),
  comment: z.string().nullable(),
  reviewer: publicUserSchema,
  listingId: z.uuid(),
  createdAt: z.iso.datetime(),
});
export type Review = z.infer<typeof reviewSchema>;

export const createReportSchema = z.object({
  targetType: z.enum(REPORT_TARGET_TYPES),
  targetId: z.uuid(),
  reason: z.enum(REPORT_REASONS),
  details: z.string().trim().max(1000).optional(),
});
export type CreateReportInput = z.infer<typeof createReportSchema>;

export const reportSchema = z.object({
  id: z.uuid(),
  targetType: z.enum(REPORT_TARGET_TYPES),
  targetId: z.uuid(),
  reason: z.enum(REPORT_REASONS),
  details: z.string().nullable(),
  status: z.enum(REPORT_STATUSES),
  reporter: publicUserSchema,
  createdAt: z.iso.datetime(),
});
export type Report = z.infer<typeof reportSchema>;

export const reportQuerySchema = cursorPageQuerySchema.extend({
  status: z.enum(REPORT_STATUSES).optional(),
});
export type ReportQuery = z.infer<typeof reportQuerySchema>;

export const resolveReportSchema = z.object({
  status: z.enum(['actioned', 'dismissed']),
  /** Set when the moderator also suspends the reported user or removes the listing. */
  action: z.enum(['none', 'remove_listing', 'suspend_user']).default('none'),
  note: z.string().trim().max(500).optional(),
});
export type ResolveReportInput = z.infer<typeof resolveReportSchema>;

export const blockUserSchema = z.object({
  userId: z.uuid(),
});
export type BlockUserInput = z.infer<typeof blockUserSchema>;

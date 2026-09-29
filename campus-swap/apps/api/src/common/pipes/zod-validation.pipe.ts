import { BadRequestException, Injectable, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/**
 * Validates a request body or query against a schema from @campus-swap/shared,
 * so the app and the API enforce exactly the same rules. Failures come back as
 * a field-keyed map the sell form and sign-in screen can render inline.
 */
@Injectable()
export class ZodValidationPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const result = this.schema.safeParse(value);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const key = issue.path.join('.') || '_';
        fieldErrors[key] ??= issue.message;
      }
      throw new BadRequestException({
        message: 'Validation failed',
        errors: fieldErrors,
      });
    }

    return result.data;
  }
}

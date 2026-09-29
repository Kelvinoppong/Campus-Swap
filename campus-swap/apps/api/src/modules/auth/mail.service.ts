import { LIMITS } from '@campus-swap/shared';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

import { ENV, type Env } from '../../config/env';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resend: Resend | null;

  constructor(@Inject(ENV) private readonly env: Env) {
    this.resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;
  }

  /**
   * With MAIL_DRY_RUN on, the code goes to the API log instead of an inbox, so
   * local development does not need a Resend account or a real .edu address.
   */
  async sendSignInCode(email: string, code: string): Promise<void> {
    if (this.env.MAIL_DRY_RUN || !this.resend) {
      this.logger.warn(`[dry run] sign-in code for ${email}: ${code}`);
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.env.MAIL_FROM,
      to: email,
      subject: `${code} is your Campus Swap code`,
      text: [
        `Your Campus Swap sign-in code is ${code}.`,
        '',
        `It expires in ${LIMITS.signInCodeTtlMinutes} minutes and can only be used once.`,
        'If you did not ask for this, you can ignore this email.',
      ].join('\n'),
    });

    // A failed send must not reveal to the caller whether the address exists,
    // so this is logged and swallowed; the endpoint still returns `sent: true`.
    if (error) {
      this.logger.error(`Failed to send sign-in code to ${email}: ${error.message}`);
    }
  }
}

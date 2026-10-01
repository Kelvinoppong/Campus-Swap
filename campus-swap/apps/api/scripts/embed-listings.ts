/**
 * Backfills CLIP embeddings for listing photos that do not have one yet.
 *
 * New listings get embedded when they are created, so this is for the initial
 * import and for photos whose first attempt failed. It is safe to re-run:
 * `embedded_at` is the watermark, so finished photos are skipped.
 *
 *   npm run embed:listings --workspace @campus-swap/api
 */
import { PrismaClient } from '@prisma/client';

import { ClipService } from '../src/modules/discovery/clip.service';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  const clip = new ClipService();

  const pending = await prisma.listingPhoto.findMany({
    where: { embeddedAt: null },
    select: { id: true, url: true, listingId: true },
    orderBy: { createdAt: 'asc' },
  });

  if (pending.length === 0) {
    console.log('Every photo already has an embedding.');
    return;
  }

  console.log(`Embedding ${pending.length} photo(s)...`);
  let done = 0;
  let failed = 0;

  for (const photo of pending) {
    try {
      const embedding = await clip.embedImage(photo.url);
      // `embedding` is not a type Prisma Client can write, so the update goes
      // through raw SQL with an explicit vector cast.
      await prisma.$executeRawUnsafe(
        `UPDATE listing_photos SET embedding = $1::vector, embedded_at = now() WHERE id = $2::uuid`,
        `[${embedding.join(',')}]`,
        photo.id,
      );
      done += 1;
      process.stdout.write(`\r  ${done}/${pending.length}`);
    } catch (cause) {
      failed += 1;
      console.warn(`\n  skipped ${photo.id}: ${String(cause)}`);
    }
  }

  console.log(`\nDone. ${done} embedded, ${failed} skipped.`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());

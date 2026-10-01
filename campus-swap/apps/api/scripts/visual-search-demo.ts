/**
 * Runs the visual search model against the sample listing photos and prints the
 * rankings, with no database and no API involved.
 *
 * It exists because the interesting claim — that CLIP matches a plain-English
 * phrase to the right photo using nothing but pixels — is easy to assert and
 * easy to doubt. This makes it reproducible:
 *
 *   npm run demo:visual-search --workspace @campus-swap/api
 */
import { readdirSync } from 'node:fs';
import path from 'node:path';

import { ClipService } from '../src/modules/discovery/clip.service';

const PHOTO_DIR = path.resolve(__dirname, '../../mobile/assets/mock');

const QUERIES = [
  'a leather jacket',
  'a video game console',
  'a bicycle',
  'textbooks for studying',
  'headphones',
  'a crowd at a tech conference',
  'something to wear on my feet',
  'a musical instrument',
];

function cosine(a: number[], b: number[]): number {
  // Both vectors are already unit length, so the dot product is the cosine.
  return a.reduce((sum, value, index) => sum + value * (b[index] ?? 0), 0);
}

async function main(): Promise<void> {
  const clip = new ClipService();
  const files = readdirSync(PHOTO_DIR).filter((file) => file.endsWith('.jpg'));

  console.log(`Embedding ${files.length} photos...`);
  const photos = new Map<string, number[]>();
  for (const file of files) {
    photos.set(file, await clip.embedImage(path.join(PHOTO_DIR, file)));
  }

  console.log('\nText query -> closest photos\n');
  for (const query of QUERIES) {
    const queryVector = await clip.embedText(query);
    const ranked = [...photos.entries()]
      .map(([file, vector]) => ({ file, score: cosine(queryVector, vector) }))
      .sort((a, b) => b.score - a.score);

    const [best, ...rest] = ranked;
    if (!best) continue;
    console.log(`  "${query}"`);
    console.log(`     ${best.score.toFixed(3)}  ${best.file}   <- top match`);
    for (const row of rest.slice(0, 2)) {
      console.log(`     ${row.score.toFixed(3)}  ${row.file}`);
    }
    console.log('');
  }

  console.log('Photo -> visually similar photos\n');
  for (const subject of ['console.jpg', 'coat.jpg', 'books.jpg']) {
    const vector = photos.get(subject);
    if (!vector) continue;
    const ranked = [...photos.entries()]
      .filter(([file]) => file !== subject)
      .map(([file, other]) => ({ file, score: cosine(vector, other) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);

    console.log(`  ${subject}`);
    for (const row of ranked) console.log(`     ${row.score.toFixed(3)}  ${row.file}`);
    console.log('');
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

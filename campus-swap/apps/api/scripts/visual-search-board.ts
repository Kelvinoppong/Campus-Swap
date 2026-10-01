/**
 * Renders the visual-search results board used in the README, so the figure can
 * be regenerated rather than hand-assembled and quietly drifting from reality.
 *
 *   npm run demo:board --workspace @campus-swap/api
 */
import path from 'node:path';

import sharp from 'sharp';

import { ClipService } from '../src/modules/discovery/clip.service';

const DIR = path.resolve(__dirname, '../../mobile/assets/mock');
const OUT = path.resolve(__dirname, '../../../../docs/screenshots/visual-search.png');

const QUERIES = [
  'something to wear on my feet',
  'a musical instrument',
  'a leather jacket',
  'a video game console',
  'a crowd at a tech conference',
  'textbooks for studying',
];
const FILES = [
  'arch.jpg', 'beauty.jpg', 'bike.jpg', 'books.jpg', 'coat.jpg', 'conference.jpg',
  'console.jpg', 'dorm.jpg', 'guitar.jpg', 'headphones.jpg', 'hero.jpg', 'sneakers.jpg',
];

const W = 1200;
const PAD = 44;
const HEAD = 116;
const ROW = 146;
const CARD_W = 158;
const CARD_H = 112;
const GAP = 16;
const COL_X = 400;
const H = HEAD + QUERIES.length * ROW + PAD;

const dot = (a: number[], b: number[]) => a.reduce((s, v, i) => s + v * (b[i] ?? 0), 0);

async function thumb(file: string, dim: boolean): Promise<Buffer> {
  const mask = Buffer.from(
    `<svg width="${CARD_W}" height="${CARD_H}"><rect width="${CARD_W}" height="${CARD_H}" rx="10" fill="#fff"/></svg>`,
  );
  let image = sharp(path.join(DIR, file)).resize(CARD_W, CARD_H, { fit: 'cover' });
  if (dim) image = image.modulate({ brightness: 0.42, saturation: 0.35 });
  return image.composite([{ input: mask, blend: 'dest-in' }]).png().toBuffer();
}

async function main(): Promise<void> {
  const clip = new ClipService();
  const photos = new Map<string, number[]>();
  for (const file of FILES) photos.set(file, await clip.embedImage(path.join(DIR, file)));

  const layers: sharp.OverlayOptions[] = [];
  const svg: string[] = [
    `<text x="${PAD}" y="52" fill="#ffffff" font-size="29" font-weight="700" font-family="Helvetica,Arial">Visual search: plain English to listing photos</text>`,
    `<text x="${PAD}" y="82" fill="#8b93a7" font-size="16" font-family="Helvetica,Arial">CLIP image embeddings only. No tags, no titles, no keyword matching. Green is the top match; numbers are cosine similarity.</text>`,
  ];

  for (const [index, query] of QUERIES.entries()) {
    const queryVector = await clip.embedText(query);
    const ranked = [...photos.entries()]
      .map(([file, vector]) => ({ file, score: dot(queryVector, vector) }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 4);

    const top = HEAD + index * ROW;
    svg.push(
      `<line x1="${PAD}" y1="${top - 14}" x2="${W - PAD}" y2="${top - 14}" stroke="#1e2230" stroke-width="1"/>`,
      `<text x="${PAD}" y="${top + 60}" fill="#ffffff" font-size="19" font-weight="600" font-family="Helvetica,Arial">&#8220;${query}&#8221;</text>`,
    );

    for (const [rank, result] of ranked.entries()) {
      const x = COL_X + rank * (CARD_W + GAP);
      layers.push({ input: await thumb(result.file, rank > 0), left: x, top });

      const isTop = rank === 0;
      if (isTop) {
        svg.push(
          `<rect x="${x - 2}" y="${top - 2}" width="${CARD_W + 4}" height="${CARD_H + 4}" rx="12" fill="none" stroke="#4ade80" stroke-width="2"/>`,
        );
      }
      svg.push(
        `<text x="${x}" y="${top + CARD_H + 20}" fill="${isTop ? '#4ade80' : '#6f7789'}" font-size="13" font-family="Helvetica,Arial">${result.score.toFixed(3)}${isTop ? '  &#10003;' : ''}</text>`,
      );
    }
  }

  layers.push({
    input: Buffer.from(`<svg width="${W}" height="${H}">${svg.join('')}</svg>`),
    left: 0,
    top: 0,
  });

  await sharp({
    create: { width: W, height: H, channels: 4, background: '#0f1115' },
  })
    .composite(layers)
    .png()
    .toFile(OUT);

  console.log(`wrote ${OUT}`);
}

void main();

import { Injectable, Logger } from '@nestjs/common';

/**
 * CLIP embeds images and text into the *same* 512-dimensional space, which is
 * what makes both features here possible from one model: "items that look like
 * this one" is image-to-image, and "red leather jacket" is text-to-image, with
 * no tags, categories or captions involved.
 *
 * Model: Xenova/clip-vit-base-patch32, run locally through ONNX. Keeping it
 * in-process avoids a Python service, and at this scale the latency is fine.
 */
export const EMBEDDING_DIMENSIONS = 512;

const MODEL_ID = 'Xenova/clip-vit-base-patch32';

/** The parts of Transformers.js we use, typed loosely because its own types
 *  are generated and awkward to import under CommonJS. */
interface ClipPipeline {
  tokenizer: (
    texts: string[],
    options: { padding: boolean; truncation: boolean },
  ) => unknown;
  textModel: (inputs: unknown) => Promise<{ text_embeds: { data: ArrayLike<number> } }>;
  processor: (image: unknown) => Promise<unknown>;
  visionModel: (inputs: unknown) => Promise<{ image_embeds: { data: ArrayLike<number> } }>;
  readImage: (source: string) => Promise<unknown>;
}

@Injectable()
export class ClipService {
  private readonly logger = new Logger(ClipService.name);

  /**
   * The weights are ~90MB, so they load on first use rather than at boot, and
   * a single promise is shared: two requests arriving together must not each
   * start their own download.
   */
  private pipeline: Promise<ClipPipeline> | null = null;

  private load(): Promise<ClipPipeline> {
    this.pipeline ??= (async () => {
      this.logger.log(`Loading ${MODEL_ID}; first run downloads the weights`);

      const {
        AutoProcessor,
        AutoTokenizer,
        CLIPTextModelWithProjection,
        CLIPVisionModelWithProjection,
        RawImage,
        // Transformers.js ships both builds; this module is CommonJS, so it
        // takes the `require` condition and needs TypeScript told the same.
        // eslint-disable-next-line @typescript-eslint/no-require-imports
      } = require('@huggingface/transformers') as typeof import(
        '@huggingface/transformers',
        { with: { 'resolution-mode': 'require' } }
      );

      const [tokenizer, textModel, processor, visionModel] = await Promise.all([
        AutoTokenizer.from_pretrained(MODEL_ID),
        CLIPTextModelWithProjection.from_pretrained(MODEL_ID),
        AutoProcessor.from_pretrained(MODEL_ID),
        CLIPVisionModelWithProjection.from_pretrained(MODEL_ID),
      ]);

      this.logger.log('CLIP ready');

      return {
        tokenizer: (texts, options) => tokenizer(texts, options),
        textModel: (inputs) =>
          textModel(inputs as Parameters<typeof textModel>[0]) as Promise<{
            text_embeds: { data: ArrayLike<number> };
          }>,
        processor: (image) => processor(image as Parameters<typeof processor>[0]),
        visionModel: (inputs) =>
          visionModel(inputs as Parameters<typeof visionModel>[0]) as Promise<{
            image_embeds: { data: ArrayLike<number> };
          }>,
        readImage: (source) => RawImage.read(source),
      } satisfies ClipPipeline;
    })();

    return this.pipeline;
  }

  /**
   * Scaling to unit length means cosine similarity is just a dot product, and
   * it is what lets pgvector's `<=>` operator rank results directly.
   */
  private normalize(raw: ArrayLike<number>): number[] {
    const vector = Array.from(raw);
    const magnitude = Math.hypot(...vector);
    // A zero vector would divide by zero; it only happens on a decode failure.
    if (magnitude === 0) return vector;
    return vector.map((value) => value / magnitude);
  }

  /** `source` can be a URL or a local path. */
  async embedImage(source: string): Promise<number[]> {
    const clip = await this.load();
    const image = await clip.readImage(source);
    const inputs = await clip.processor(image);
    const { image_embeds } = await clip.visionModel(inputs);
    return this.normalize(image_embeds.data);
  }

  async embedText(text: string): Promise<number[]> {
    const clip = await this.load();
    const inputs = clip.tokenizer([text], { padding: true, truncation: true });
    const { text_embeds } = await clip.textModel(inputs);
    return this.normalize(text_embeds.data);
  }
}

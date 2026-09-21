import { defineCollection } from 'astro:content';
import { file } from 'astro/loaders';
import { z } from 'astro/zod';

export const collections = {
  posts: defineCollection({
    loader: file('content/archives.json', { parser: text => JSON.parse(text).records }),
    schema: z.object({ id: z.string(), slug: z.string(), title: z.string(), category: z.string() }).passthrough(),
  }),
};

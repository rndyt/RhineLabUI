import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { readPosts } from './blog-content.mjs';
import { validateContent, archiveText } from './archive-content.mjs';
export async function exportBlog() {
  // Complete validation before replacing any generated output.
  const content = validateContent(await readPosts());
  const archiveRoot = new URL('../public/archives/', import.meta.url);
  const postRoot = new URL('../public/posts/', import.meta.url);
  await fs.mkdir(archiveRoot, { recursive: true });
  await fs.rm(new URL('../public/blog/', import.meta.url), { recursive: true, force: true });
  // These directories contain generated output only; Markdown sources stay intact.
  await fs.rm(postRoot, { recursive: true, force: true });
  for (const name of await fs.readdir(archiveRoot)) {
    if (/^(RHINE-LAB|RNDYT)-X-\d+\.txt$/.test(name)) await fs.unlink(new URL(name, archiveRoot));
  }
  for (const r of content.records) {
    await fs.writeFile(new URL(`RNDYT-${r.id}.txt`, archiveRoot), archiveText(r));
  }
  await fs.writeFile(new URL('../content/archives.json', import.meta.url), JSON.stringify(content, null, 2) + '\n');
  console.log(`Prepared ${content.records.length} posts across ${content.columns.length} categories.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await exportBlog();

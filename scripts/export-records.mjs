import fs from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { readPosts, readerPage, indexPage } from './blog-content.mjs';
import { validateContent, archiveText } from './archive-content.mjs';
export async function exportBlog() {
  // Complete validation before replacing any generated output.
  const content = validateContent(await readPosts());
  const archiveRoot = new URL('../public/archives/', import.meta.url);
  const postRoot = new URL('../public/posts/', import.meta.url);
  await fs.mkdir(archiveRoot, { recursive: true });
  await fs.mkdir(new URL('../public/blog/', import.meta.url), { recursive: true });
  // These directories contain generated output only; Markdown sources stay intact.
  await fs.rm(postRoot, { recursive: true, force: true });
  for (const name of await fs.readdir(archiveRoot)) {
    if (/^(RHINE-LAB|RNDYT)-X-\d+\.txt$/.test(name)) await fs.unlink(new URL(name, archiveRoot));
  }
  for (const r of content.records) {
    await fs.writeFile(new URL(`RNDYT-${r.id}.txt`, archiveRoot), archiveText(r));
    const dir = new URL(`${r.slug}/`, postRoot);
    await fs.mkdir(dir, {recursive: true});
    await fs.writeFile(new URL('index.html', dir), readerPage(r, content.records));
  }
  await fs.writeFile(new URL('../public/blog/index.html', import.meta.url), indexPage(content.records, content.categories));
  await fs.writeFile(new URL('../content/archives.json', import.meta.url), JSON.stringify(content, null, 2) + '\n');
  console.log(`Prepared ${content.records.length} posts across ${content.columns.length} categories.`);
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await exportBlog();

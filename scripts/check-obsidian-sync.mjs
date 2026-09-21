import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { syncBlog } from './sync-obsidian-blog.mjs';

async function fixture(t) {
  const root = await mkdtemp(join(tmpdir(), 'rhine-sync-test-'));
  t.after(() => rm(root, { recursive: true, force: true }));
  const options = { source: join(root, 'source'), destination: join(root, 'posts'), assets: join(root, 'assets') };
  await mkdir(options.source);
  const note = (name, body = '正文', metadata = '') => writeFile(join(options.source, name), `---\ntitle: ${name}\ndate: 2026-09-21\n${metadata}---\n${body}\n`);
  const manifest = async () => JSON.parse(await readFile(join(options.destination, '.obsidian-sync-manifest.json'), 'utf8'));
  return { ...options, options, note, manifest };
}
test('sync resolves links, headings and referenced attachments, skips drafts and code examples', async t => {
  const f = await fixture(t);
  await f.note('first.md', '[[second#标题|下一篇]]\n![[photo.png|100]]\n[普通](second.md)\n[图片](photo.png)\n[[draft]]\n`[[second]]`\n```md\n![[unused.png]]\n```');
  await f.note('second.md', '# 标题\n\n正文');
  await f.note('draft.md', 'PRIVATE', 'draft: true\n');
  await writeFile(join(f.source, 'photo.png'), 'image');
  await writeFile(join(f.source, 'unused.png'), 'unused');
  const result = await syncBlog(f.options);
  assert.equal(result.posts, 2); assert.equal(result.assets, 1);
  const body = await readFile(join(f.destination, 'obsidian/first.md'), 'utf8');
  assert.match(body, /\/posts\/second\/#section-1/);
  assert.match(body, /\/post-assets\/photo.png/);
  assert.match(body, /`\[\[second\]\]`/);
  assert.match(body, /!\[\[unused.png\]\]/);
  assert.doesNotMatch(body, /PRIVATE|\/posts\/draft/);
  await assert.rejects(readFile(join(f.assets, 'unused.png')));
});
test('repeated sync is stable; deletions reserve IDs and preserve unmanaged files', async t => {
  const f = await fixture(t);
  await f.note('first.md'); await f.note('second.md');
  await syncBlog(f.options);
  const first = await f.manifest();
  await syncBlog(f.options); assert.deepEqual(await f.manifest(), first);
  await writeFile(join(f.destination, 'keep.txt'), 'manual');
  await rm(join(f.source, 'first.md'));
  await f.note('third.md');
  await syncBlog(f.options);
  const next = await f.manifest();
  assert.equal(next.entries['second.md'].archiveId, first.entries['second.md'].archiveId);
  assert.notEqual(next.entries['third.md'].archiveId, first.entries['first.md'].archiveId);
  await assert.rejects(readFile(join(f.destination, 'obsidian/first.md')));
  assert.equal(await readFile(join(f.destination, 'keep.txt'), 'utf8'), 'manual');
});
test('invalid metadata, empty publication and traversal manifest do not replace published files', async t => {
  const f = await fixture(t);
  await f.note('first.md'); await syncBlog(f.options);
  const original = await readFile(join(f.destination, 'obsidian/first.md'), 'utf8');
  await f.note('first.md', 'changed', 'category: 123\n');
  await assert.rejects(syncBlog(f.options));
  assert.equal(await readFile(join(f.destination, 'obsidian/first.md'), 'utf8'), original);
  await f.note('first.md', 'private', 'publish: false\n');
  await assert.rejects(syncBlog(f.options), /至少需要一篇/);
  const manifest = await f.manifest(); manifest.files.push('../outside.md');
  await writeFile(join(f.destination, '.obsidian-sync-manifest.json'), JSON.stringify(manifest));
  await assert.rejects(syncBlog(f.options), /非法同步路径/);
});

test('explicit IDs and automatically assigned IDs do not collide', async t => {
  const f = await fixture(t);
  await f.note('a.md', '正文', 'archiveId: X-001\n');
  await f.note('b.md');
  await syncBlog(f.options);
  const manifest = await f.manifest();
  assert.equal(manifest.entries['a.md'].archiveId, 'X-001');
  assert.equal(manifest.entries['b.md'].archiveId, 'X-002');
});

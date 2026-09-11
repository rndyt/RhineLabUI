import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { loadContent, validateContent, archiveText } from './archive-content.mjs';
import { renderMarkdown, readPosts } from './blog-content.mjs';
import { fileAtCell, selectionCell, CONTENT_ROW_PERIOD, nearestOccurrence } from '../src/archive-loop.ts';
import { columnFiles, archiveColumns, fileLocation } from '../src/data.ts';
const content = await loadContent();
test('Markdown sources, runtime content, standalone pages and exports agree', async () => {
  assert.deepEqual(await readPosts(), content);
  for (const r of content.records) {
    assert.equal(await readFile(new URL(`../public/archives/RNDYT-${r.id}.txt`, import.meta.url), 'utf8'), archiveText(r));
    const html = await readFile(new URL(`../public/posts/${r.slug}/index.html`, import.meta.url), 'utf8');
    assert.ok(html.includes(r.bodyHtml));
    assert.ok(html.includes(`/?post=${r.slug}`));
    assert.ok(html.includes('noindex, nofollow'));
  }
});
test('variable column lengths, negative coordinates, wraparound and rebasing preserve selected posts', () => {
  for (let lane=0; lane<archiveColumns.length; lane++) {
    const files=columnFiles(lane);
    for (let row=-50;row<60;row++) {
      const cell={lane,row};
      const index=fileAtCell(cell);
      assert.ok(files.includes(index));
      assert.equal(fileAtCell({lane:lane+archiveColumns.length,row}),index);
      assert.equal(fileAtCell({lane,row:row+CONTENT_ROW_PERIOD*1000}),index);
      assert.equal(fileAtCell({lane:lane-archiveColumns.length*1000,row:row-CONTENT_ROW_PERIOD*1000}),index);
      for (const direction of [-1,1]) {
        const target=files[((files.indexOf(index)+direction)%files.length+files.length)%files.length];
        const selected=selectionCell(target,cell,{axis:'row',direction});
        assert.equal(selected.row,row+direction);
        assert.equal(fileAtCell(selected),target);
      }
    }
    for(const index of files) assert.equal(fileAtCell(fileLocation(index)),index);
  }
  assert.equal(nearestOccurrence(12,104,3),105);
});
test('article IDs can remain stable when reordered or when an earlier post is deleted', () => {
  const edited=structuredClone(content); edited.records.reverse(); validateContent(edited);
  edited.records=edited.records.filter(r=>r.id!==content.records[0].id); validateContent(edited);
});
for (const [name,mutate] of [
 ['duplicate ID',c=>c.records[1].id=c.records[0].id],
 ['duplicate slug',c=>c.records[1].slug=c.records[0].slug],
 ['blank body',c=>c.records[0].body=' '],
 ['unsafe source',c=>c.records[0].source='javascript:alert(1)'],
 ['path traversal slug',c=>c.records[0].slug='../private'],
 ['empty category',c=>{c.categories.push('empty');c.columns.push('empty')}],
 ['unknown category',c=>c.records[0].category='unknown'],
 ['duplicate category',c=>c.columns.push(c.columns[0])],
 ['empty corpus',c=>c.records=[]],
]) test(`rejects ${name}`,()=>{const edited=structuredClone(content);mutate(edited);assert.throws(()=>validateContent(edited))});
test('Markdown preserves structure and code while rejecting executable HTML and dangerous URLs',()=>{
 const {bodyHtml,headings}=renderMarkdown('# Intro\n\n## Same\n\n## Same\n\n```js\nconst x = "<script>";\n```\n\n<script>alert(1)</script>\n\n[x](javascript:alert(1))\n\n<img src="x" onerror="alert(1)">\n\n| A | B |\n| - | - |\n| 1 | 2 |');
 assert.equal(headings.length,3);assert.equal(new Set(headings.map(h=>h.id)).size,3);
 assert.ok(bodyHtml.includes('<table>'));assert.ok(bodyHtml.includes('&lt;script&gt;'));
 assert.doesNotMatch(bodyHtml,/<script|onerror=|href="javascript:/i);
 for(const h of headings) assert.ok(bodyHtml.includes(`id="${h.id}"`));
});

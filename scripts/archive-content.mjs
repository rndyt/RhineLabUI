import fs from 'node:fs/promises';
export function validateContent(content) {
  if (!content || typeof content !== 'object' || Array.isArray(content)) throw Error('档案数据必须是 JSON 对象');
  const { columns, categories, records } = content;
  for (const [key, names] of Object.entries({columns, categories})) {
    if (!Array.isArray(names) || !names.length || !names.every(n => typeof n === 'string' && n.trim())) throw Error(`${key}: 必须包含非空分类`);
    if (new Set(names).size !== names.length || names.includes('全部档案')) throw Error(`${key}: 分类不能重复或使用“全部档案”`);
  }
  if (columns.length !== categories.length || columns.some(n => !categories.includes(n))) throw Error('分类必须相同');
  if (!Array.isArray(records) || !records.length) throw Error('至少需要一篇文章');
  const ids = new Set(), slugs = new Set();
  for (const [index, r] of records.entries()) {
    if (!r || typeof r !== 'object') throw Error(`records[${index}]: 必须是档案对象`);
    for (const field of ['id','title','en','department','category','date','lead','clearance','abstract','slug','source','body','bodyHtml']) {
      if (typeof r[field] !== 'string' || !r[field].trim()) throw Error(`records[${index}].${field}: 必须是非空文本`);
    }
    if (!/^X-\d{3,}$/.test(r.id) || ids.has(r.id)) throw Error('无效或重复编号');
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(r.slug) || slugs.has(r.slug)) throw Error('无效或重复 slug');
    ids.add(r.id); slugs.add(r.slug);
    if (!categories.includes(r.category)) throw Error('未知分类');
    if (r.source !== `/posts/${r.slug}/`) throw Error('文章链接必须匹配 slug');
    if (!Array.isArray(r.tags) || !r.tags.every(t => typeof t === 'string')) throw Error('无效标签');
    if (!Array.isArray(r.headings) || !r.headings.every(h => /^section-\d+$/.test(h.id) && typeof h.text === 'string')) throw Error('无效目录');
  }
  if (columns.some(n => !records.some(r => r.category === n))) throw Error('分类不可为空');
  return content;
}
export async function loadContent() {
 return validateContent(JSON.parse(await fs.readFile(new URL('../content/archives.json', import.meta.url), 'utf8')));
}
export function archiveText(r) {
 return `\uFEFFRNDYT · PERSONAL BLOG\n${r.id} / ${r.title}\n作者：${r.lead}\n日期：${r.date}\n分类：${r.category}\n标签：${r.tags.join(' / ')}\n${r.preview ? '示例内容，非真实经历或成果。\n' : ''}\n${r.body}\n`;
}

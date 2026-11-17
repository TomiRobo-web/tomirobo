// docs/designsystem/（デザインルールの正本）から、サイトで使う CSS を作る。
//   tokens.json           → src/styles/tokens.css      （CSS 変数）
//   components/bundle.css → src/styles/components.css  （部品のスタイル）
// `npm run build` と `npm run dev` の前に自動で動く。作られた2つのファイルは手で直さない。
import { readFileSync, writeFileSync } from 'node:fs';

const ds = new URL('../docs/designsystem/', import.meta.url);
const out = new URL('../src/styles/', import.meta.url);
const tokens = JSON.parse(readFileSync(new URL('tokens.json', ds), 'utf8'));

const lines = [];
const firstTheme = tokens.color.themes[0].id;
for (const t of tokens.color.tokens) {
  lines.push(`  --${t.name}: ${typeof t.value === 'string' ? t.value : t.value[firstTheme]};`);
}
for (const [family, group] of Object.entries(tokens)) {
  if (['name', 'version', 'color', 'type'].includes(family) || !group?.tokens) continue;
  for (const t of group.tokens) lines.push(`  --${t.name}: ${t.value};`);
}
for (const [key, stack] of Object.entries(tokens.type.families)) {
  lines.push(`  --font-${key}: ${stack};`);
}
const note = '/* 自動生成：docs/designsystem から scripts/sync-design.mjs が作る。手で直さない */\n';
writeFileSync(new URL('tokens.css', out), `${note}:root {\n${lines.join('\n')}\n}\n`);
writeFileSync(new URL('components.css', out), note + readFileSync(new URL('components/bundle.css', ds), 'utf8'));
console.log(`design: tokens.css (${lines.length} 変数) と components.css を更新しました`);

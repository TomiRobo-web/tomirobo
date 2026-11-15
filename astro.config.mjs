// @ts-check
import { defineConfig } from 'astro/config';

// 静的サイトとして出力し、Cloudflare Workers の Static Assets で配信する。
// サーバー処理（アダプター）は使わない。引継ぎ時に壊れる部品を減らすため。
export default defineConfig({
  // 仮公開URL（Cloudflare Workers の無料URL）。独自ドメイン等に移すときは書き換える
  site: 'https://tomirobo.toyamarobocon.workers.dev',
  output: 'static',
  trailingSlash: 'ignore',
  // 記号（' " -- など）を勝手に書き換えない。旧サイト・esa の文章をそのまま表示するため
  markdown: { smartypants: false },
});

// @ts-check
import { defineConfig } from 'astro/config';

// 静的サイトとして出力し、Cloudflare Workers の Static Assets で配信する。
// サーバー処理（アダプター）は使わない。引継ぎ時に壊れる部品を減らすため。
export default defineConfig({
  // 正式なURLが決まったら書き換える（例: https://tomirobo-website.<account>.workers.dev）
  site: 'https://example.invalid',
  output: 'static',
  trailingSlash: 'ignore',
});

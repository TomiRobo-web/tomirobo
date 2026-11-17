import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// NEWS（活動報告・技術ブログ・大会報告をすべてここにまとめる）
// - 手書きの記事: src/content/news/*.md
// - esa から取り込む記事: 同期処理が src/content/news/ に保存する予定（未実装）
const news = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/news' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    // 例: ["大会"], ["技術ブログ"], ["イベント"]
    tags: z.array(z.string()).default([]),
    // 記事の出どころ。esa 由来の記事は esa 側で修正する（同期で上書きされるため）
    source: z.enum(['manual', 'esa']).default('manual'),
    esa_id: z.number().optional(),
    revision: z.number().optional(),
    draft: z.boolean().default(false),
    // 執筆者（任意）。例: "伊藤優心（電装班）"
    author: z.string().optional(),
    // 何年度のチームの記事か（旧サイトの年別ページ）。未指定なら日付から年度を計算する
    team_year: z.number().optional(),
    // 旧 Google Sites から移した記事の元ページ
    legacy_url: z.string().url().optional(),
    // 旧サイトに日付がなく、本文などから推定した日付のとき true（一覧では「日付不明」と表示）
    date_estimated: z.boolean().default(false),
  }),
});

export const collections = { news };

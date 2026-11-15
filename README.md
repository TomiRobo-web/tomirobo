# TomiRobo 公式サイト

富山大学ロボコンプロジェクト TomiRobo の公式サイトのソースです。
Astro で静的サイトを作り、Cloudflare Workers（無料プラン）の Static Assets で配信します。

> 現在は試作段階です。各ページの本文は仮の文章です。`src/content/news/sample-*.md` は正式公開前に削除します。

## ページ構成

| URL | ページ | ファイル |
|---|---|---|
| `/` | HOME / トップ（新着 NEWS を表示） | `src/pages/index.astro` |
| `/about/` | ABOUT / TomiRoboとは | `src/pages/about.astro` |
| `/news/` | NEWS / 活動報告（活動報告・技術ブログ・大会報告） | `src/pages/news/` |
| `/news/tags/<タグ>/` | NEWS のタグ絞り込み（例: 大会） | `src/pages/news/tags/[tag].astro` |
| `/join/` | JOIN / メンバー募集 | `src/pages/join.astro` |
| `/sponsor/` | SPONSOR / 協賛について | `src/pages/sponsor.astro` |
| `/contact/` | CONTACT / お問い合わせ | `src/pages/contact.astro` |

メニューの項目は `src/components/nav.ts` で一括管理しています。

## NEWS 記事の書き方

`src/content/news/` に Markdown ファイルを1本追加します。ファイル名がそのまま URL になります（例: `2026-kanto-summer.md` → `/news/2026-kanto-summer/`）。

```markdown
---
title: "関東夏ロボコン2026に出場しました"
date: 2026-09-15
tags: ["大会"]
---

本文
```

- `tags` に書いた言葉がそのままタグになり、絞り込みページが自動で作られます。大会の記事には `大会` を付けます。
- `draft: true` にすると公開されません。
- `source: esa` の記事は esa から自動で取り込んだ記事です（予定・未実装）。esa 側で直してください。こちらで直しても次の取り込みで上書きされます。

## 手元で動かす

Node.js 22（`.node-version` 参照。Astro 7.4 は 22.23.4 以上が必要）を入れてから:

```sh
npm install
npm run dev        # http://localhost:4321 で確認
npm run build      # dist/ に静的ファイルを出力
npx wrangler dev   # Cloudflare Workers と同じ仕組みで dist/ を配信して確認
```

## 公開の仕組み

- `wrangler.jsonc` で `dist/` を Cloudflare Workers の Static Assets として配信します。サーバー処理はありません。
- 存在しない URL には `404.html` を返します。
- 正式公開までは全ページに `noindex` を入れています（`src/layouts/BaseLayout.astro`）。公開時に外します。
- Cloudflare Workers Builds との接続は未設定です。

## 今後の予定（未実装）

- esa の公開用カテゴリの記事を取り込んでプルリクエストにする同期処理（GitHub Actions）
- 固定ページの編集画面（Pages CMS）
- デザイン（Design System）と既存 Google Sites からの内容の移行
- 大学の旧URLからの転送

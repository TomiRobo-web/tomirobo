# TomiRobo 公式サイト

富山大学ロボコンプロジェクト TomiRobo の公式サイトのソースです。
Astro で静的サイトを作り、Cloudflare Workers（無料プラン）の Static Assets で配信します。

> 現在は制作中です。ABOUT・JOIN・SPONSOR・CONTACT と NEWS の記事は旧 Google Sites から移行済み（2026-11-15）。デザインは仮です。

- ソース: https://github.com/TomiRobo-web/tomirobo （Cloudflare Workers Builds はこのリポジトリにつながっています）

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
- `author` に執筆者（例: `"伊藤優心（電装班）"`）を書くと記事ページに表示されます。
- `team_year` は何年度のチームの記事か。省略すると日付から年度（4月始まり）を計算します。NEWS 一覧はこの年度ごとにまとまります。
- `source: esa` の記事は esa から自動で取り込んだ記事です（予定・未実装）。esa 側で直してください。こちらで直しても次の取り込みで上書きされます。

## 旧 Google Sites から移した記事

- `src/content/news/legacy/` は旧サイトの Activity（年別ページ）と Tech Blog から移した記事です。画像は `public/images/news/legacy/` にあります。
- `legacy_url` は元のページです。
- 旧サイトで日付がなかった記事は、本文の日付か年度の4月1日を仮の日付にして `date_estimated: true` を付けています。一覧では「日付不明（○○年度）」と表示されます。
- 「大会」タグは記事タイトルから自動で付けました。間違いがあれば `tags` を直してください。

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
- Cloudflare Workers Builds に接続済みです。`main` に push すると自動でビルド・公開されます。
  - Worker名: `tomirobo`（`wrangler.jsonc` の `name` と必ず一致させる。違うとビルドが失敗する）
  - 仮公開URL: https://tomirobo.toyamarobocon.workers.dev/
  - Build command: `npm run build` / Deploy command: `npx wrangler deploy`

## プレビュー（公開前の確認）

- `main` 以外のブランチに push すると、Cloudflare がプレビュー用にビルドします（設定 → ビルド → プレビューのベース →「プレビューブランチのビルド」がオン、プレビューコマンド `npx wrangler preview`）。
- 結果は Cloudflare の Worker `tomirobo` の画面上部で「プロダクション」を「プレビュー」に切り替え、「デプロイ」タブで確認します。
- プレビューの URL は `*-tomirobo.toyamarobocon.workers.dev` の形になります。
- 内容を確認してから、GitHub のプルリクエストを `main` にマージすると本番に反映されます。

## 今後の予定（未実装）

- esa の公開用カテゴリの記事を取り込んでプルリクエストにする同期処理（GitHub Actions）
- 固定ページの編集画面（Pages CMS）
- デザイン（Design System）と既存 Google Sites からの内容の移行
- 大学の旧URLからの転送

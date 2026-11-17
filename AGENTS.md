# このリポジトリで作業する AI・人へ

TomiRobo 公式サイト（Astro ＋ Cloudflare Workers）のソースです。

## 見た目に触る前に必ず読む

デザインのルールは `docs/designsystem/` にあります（ここが正本）。

1. `docs/designsystem/README.md` … 全体と「何をするとき、どれを読むか」の表
2. `docs/designsystem/guidelines/AI_WORKFLOW.md` … 作業の進め方、やってはいけないこと、出す前の確認

色・文字サイズ・余白は `docs/designsystem/tokens.json` のトークンだけを使い、値を直接書かないでください。

## 作業のきまり

- `main` へ直接 push しない。ブランチを切ってプルリクエストを出す（`main` に入ると本番に公開される）。
- 1回の作業は1ページ（または共通部品1つ）。
- 旧サイトから移した本文（`src/content/news/legacy/`、各ページの文章）は、頼まれていないかぎり書き換えない。
- `npm run build` が通ることを確かめてから出す。
- サイトの構成・運用は `README.md` を参照。

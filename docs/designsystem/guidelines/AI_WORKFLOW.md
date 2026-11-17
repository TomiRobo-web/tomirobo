# 作業の進め方（AI_WORKFLOW）

AI（Claude、Codex、ほかのモデル）と人が、同じ手順でサイトの見た目を直すためのきまりです。

## 作業の前に

1. `README.md` と `guidelines/FOUNDATIONS.md` を読む。
2. 直すページの骨格を `guidelines/PAGE_PATTERNS.md` で確かめる。
3. 使う部品を `guidelines/COMPONENT_GUIDE.md` で決め、その `components/<部品>/README.md` を読む。
4. 値が要るときは `tokens.json` を見る。覚えている値や推測した値を使わない。

## 作業の進め方

- **1回の作業は1ページ（または共通部品1つ）。** 共通部分（ヘッダー・フッター・トークン・部品）を先に直し、そのあとページごとの中身を直す。
- 変更は `main` 以外のブランチで行い、プルリクエストを出す。`main` に入るのは責任者が承認したものだけ。
- サイトの文章（旧サイトから移した本文）は、頼まれていないかぎり書き換えない。直したほうがよい点は提案として別に書く。
- 「やったこと」と「提案（まだやっていないこと）」を分けて報告する。

## やってはいけないこと

- 色・文字サイズ・余白・角丸の値を CSS に直接書く（必ず `var(--…)`）。
- `tokens.json` にない色、グラデーション、影、ぼかし、2px を超える角丸、アニメーションを足す。
- README の「使用禁止のフォント」を使う。フォントを足すときは責任者に確認する。
- 読むページの背景を藍にする。白い地の上で藍（`ai`）を見出し・飾りに使う。白い地の主ボタンや藍の帯を1ページに2つ以上置く。
- 絵文字、他社のロゴアイコン、素材写真、AI で作った画像を入れる。
- ルールに合わない見た目を、ルールを変えずにそのページだけで作る。
- 検索よけ（`noindex`）を、責任者の指示なしに外す。

## 出す前の確認（レビューの観点）

- [ ] 白黒だけにしても、どこが押せるか・今どこにいるかが分かる
- [ ] 藍の全面は HOME のヒーローとフッターだけ。白い地の主ボタンは1つ、藍の帯は1か所まで
- [ ] 太い枠と歯車（FrameCard）は1画面に2組まで
- [ ] 使用禁止のフォントを使っていない
- [ ] 色・余白・文字サイズはすべてトークン。直書きがない（`grep -nE '#[0-9a-fA-F]{3,6}|[0-9]+px' ` で部品以外に出ない）
- [ ] 見出しは h1 が1つ、段を飛ばしていない。題は「英字ラベル＋日本語」
- [ ] 幅 375px と 1280px で崩れない。横スクロールが出ない
- [ ] キーボードだけで全部たどれる。フォーカスの輪が見える
- [ ] 画像に `alt` がある。文字と地の差が 4.5:1 以上
- [ ] `npm run build` が通る。リンク切れ・画像切れがない

## ルールを変えたいとき

作業中に「ルールのほうが合っていない」と気づいたら、そのページで勝手に破らず、ルールを直す提案をします。

1. `docs/designsystem/` の該当ファイル（値なら `tokens.json`、考え方なら `guidelines/`）を直す。
2. `README.md` の「変更の記録」に1行足す（日付、何を、なぜ）。
3. プルリクエストを出し、責任者の承認を受ける。
4. 承認後、Claude の Design System（見本）にも同じ変更を入れる。

## サイトのコードとの対応

| ルール | サイトのコード（`TomiRobo-web/tomirobo`） |
|---|---|
| `tokens.json` | `src/styles/tokens.css`（自動で作られる。手で直さない） |
| `components/bundle.css` | `src/styles/components.css`（自動で写される。手で直さない） |
| SiteHeader・フッター | `src/layouts/BaseLayout.astro`、メニューは `src/components/nav.ts` |
| SectionHeading | `src/components/PageHeading.astro`（ページの題） |
| NewsItem・Tag | `src/components/NewsList.astro`、`TagFilter.astro` |
| Prose | `src/pages/news/[...slug].astro` の記事本文 |

`npm run build`（または `npm run design`）のたびに、`scripts/sync-design.mjs` が `docs/designsystem/` から上の2つの CSS を作り直します。見た目の値を変えるときは、必ず `docs/designsystem/` 側を直してください。

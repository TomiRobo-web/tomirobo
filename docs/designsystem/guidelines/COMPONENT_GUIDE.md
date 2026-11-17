# 部品の使い分け（COMPONENT_GUIDE）

部品は7つ。CSS は `components/bundle.css`、仕様は各 `components/<部品>/README.md`。

| 部品 | クラス | 使うとき | 使わないとき |
|---|---|---|---|
| SiteHeader | `tr-header`・`tr-nav` | 全ページの一番上 | ページ内の目次（ただのリンクの列にする） |
| SectionHeading | `tr-heading` | ページの題、ページ内の区切り | カードの題（`tr-frame__title` を使う） |
| Button | `tr-button` | 別ページへ進む・申し込むなど、はっきりした行動 | 文中のリンク（ふつうの `a`）、絞り込み（Tag） |
| Tag | `tr-tag` | NEWS の絞り込み、記事の分類 | 状態の表示、飾り |
| NewsItem | `tr-news` | 日付つきの記事の一覧（HOME の新着、NEWS） | 日付のない項目の一覧（ふつうの `ul`） |
| FrameCard | `tr-frame` | 強調したい箱（3つの班、JOIN への誘導）。1画面に2つまで（同じ並びの組は1つと数える） | 一覧の全項目を囲む、本文の囲み |
| Prose | `tr-prose` | NEWS の記事本文（Markdown でも esa の HTML でも） | 固定ページのレイアウト |

## ページ専用の小さな部品

部品というほどではない、特定のページだけで使うクラスです。CSS は同じ `bundle.css` の末尾にあります。

| クラス | 使う場所 |
|---|---|
| `tr-hero` | HOME の最初の画面（英字ラベル・コピー・導入文・主ボタン・ロゴ） |
| `tr-lead` | 各ページの題の直後の導入文 |
| `tr-band`・`tr-band--ai`・`tr-band__inner` | 区切りの帯。藍の帯は1ページに1か所まで |
| `tr-logos` | SPONSOR の協賛企業ロゴの格子 |
| `tr-contacts`・`tr-address`・`tr-map` | CONTACT の連絡先一覧・住所・地図 |
| `tr-meta`・`tr-date` | 記事の日付・年度・執筆者 |
| `tr-actions` | ボタンを並べる行 |
| `tr-figure`・`tr-float-logo` | 固定ページの画像 |

## 決め方

1. それは**移動や行動**か → 主な行動なら Button（主ボタンは1画面に1つ）、文中なら下線つきリンク。
2. それは**分類や絞り込み**か → Tag。
3. それは**日付つきの一覧**か → NewsItem。
4. それは**特に目立たせたい箱**か → FrameCard。そうでなければ箱にしない（余白と見出しで区切る）。
5. それは**長い文章**か → Prose の中に入れる。

## 状態

- ホバー：Button と FrameCard（リンクのとき）は白黒が反転。主ボタンは `ai` → `ai-deep`。
- 現在地：`aria-current="page"` を付ける。メニューは藍の下線、Tag は黒で塗る。
- フォーカス：藍の 2px の輪。消さない。
- 無効（押せない）状態：作らない。押せないものは出さず、理由を文で書く。

## 新しい部品を足すとき

1. 上の7つで作れないことを確かめる。
2. `components/<名前>/README.md`（使うとき・使わないとき・HTML の例）と `preview.html` を書く。
3. `components/bundle.css` に `tr-<名前>` のクラスを足す。値はトークンだけ。
4. この表に1行足す。プルリクエストで責任者の承認を受ける。

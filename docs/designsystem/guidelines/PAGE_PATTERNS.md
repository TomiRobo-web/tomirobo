# ページの骨格（PAGE_PATTERNS）

全ページ共通：SiteHeader → `main`（`tr-container`）→ フッター（`tr-footer`）。ページの題は SectionHeading（`tr-heading--page`）で「英字ラベル＋日本語」。

## HOME ／ トップ

1. ヒーロー（`tr-hero`）：濃い藍の全面。ヘッダーも同じ藍（`tr-header--on-ai`）。白い枠の英字ラベル＋`display` のコピー＋`lead`＋白いボタン（JOIN へ）と白枠のボタン（NEWS へ）。背景に大きな歯車、右に白い板に載せたロゴ（写真が手に入ったら写真に替える）。
2. 新着情報：SectionHeading（NEWS／新着情報）＋ NewsItem 5件＋ Button（NEWS 一覧へ）。
3. 3つの班：FrameCard（太枠＋歯車）を3つ並べた1組。
4. 藍の帯（`tr-band--ai`、このページ唯一）：協賛・お問い合わせへの誘導文＋ Button。

## ABOUT ／ TomiRoboとは

1. 題＋ `lead`（どんな団体か）。
2. 沿革の文章（`tr-text`）。ロゴを右に小さく。
3. 3つの班：SectionHeading（TEAMS／3つの班）＋ FrameCard 3つ（英字ラベルは MECHANICAL / ELECTRICAL / CONTROL）。
4. 大会の記録へのリンク（NEWS の「大会」タグ）。

## NEWS ／ 活動報告（一覧）

1. 題。
2. Tag の列（すべて・大会・技術ブログ…）。今の絞り込みに `aria-current`。
3. 年度ごと：SectionHeading（`tr-heading--rule`、「2026年度」）＋ NewsItem。新しい年度が上。

## NEWS の記事

1. 日付（`date`）・年度・執筆者 → 題（h1）→ Tag。
2. 本文は Prose。写真は本文の幅いっぱい、細い線の枠。
3. 末尾に Button（NEWS 一覧へ）。
- esa から取り込んだ記事（HTML）も同じ Prose の中に入れる。記事ごとに見た目を変えない。

## JOIN ／ メンバー募集

1. 題＋元気な `lead`（「新入部員大募集中！」）。
2. 募集の説明（`tr-text`）＋募集ポスター。
3. 主ボタン1つ（CONTACT へ）。
4. 班の紹介（ABOUT へ）と活動の様子（NEWS へ）へのリンク。

## SPONSOR ／ 協賛について

1. 題＋お礼の `lead`。
2. 協賛企業のロゴの格子（白地、細い線の枠、五十音順、ロゴの色は変えない・大きさをそろえる）。
3. 協賛のお願いの文＋ Button（CONTACT へ）。

## CONTACT ／ お問い合わせ

1. 題。
2. 連絡先の一覧（メール・X・Instagram）。名前、ひとこと、文字のリンク。各社のロゴは置かない。
3. 活動場所：住所（`address`）＋キャンパスの地図＋ Google マップ。

## やらないこと

- 白い地に主ボタンを2つ以上置く。
- HOME のヒーローとフッター以外を藍の全面にする。
- 藍の帯を2か所以上に置く。
- ページごとに違うヘッダー・フッター・見出しの形を作る。
- スライドショー、自動で動くもの、スクロールで現れる演出。

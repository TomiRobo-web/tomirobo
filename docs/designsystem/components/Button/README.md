# Button

行動を1つ示すボタン。別のページへ進む・申し込むなど、はっきりした行動に使う。

- 主ボタン（`tr-button--primary`、藍）は**1画面に1つ**。そのページでいちばんしてほしい行動に使う。
- ふつうのボタン（白地に黒枠）は、一覧へ進むなど次の行動に。ホバーで白黒が反転する。
- ラベルは動詞で終える（「見学を申し込む」「NEWS 一覧へ」）。末尾に矢印 `→` を付けてよい。
- 文中のリンクには使わない。絞り込みには Tag を使う。

```html
<a class="tr-button tr-button--primary" href="/contact/">見学を申し込む <span class="tr-button__arrow">→</span></a>
<a class="tr-button" href="/news/">NEWS 一覧へ <span class="tr-button__arrow">→</span></a>
```

使う側が決めるもの：ラベルの文、リンク先。

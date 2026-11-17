# Prose

NEWS の記事本文の入れ物。中の見出し・画像・表・コード・引用の見た目をまとめて整える。

- Markdown から作った HTML にも、esa から取り込んだ HTML（`body_html`）にも、同じ `tr-prose` を当てる。
- 幅は `text-max`（720px）。画像は細い線の枠つきで幅いっぱい。
- 記事の中で色や文字サイズを個別に指定しない。必要な見た目がなければ、ここ（`bundle.css` の `.tr-prose`）に足す。
- 記事の題（h1）は Prose の外に置く。本文の見出しは h2 から。

```html
<div class="tr-prose"> …記事の HTML… </div>
```

使う側が決めるもの：本文の HTML。

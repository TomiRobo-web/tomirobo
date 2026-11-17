# NewsItem

日付つきの記事の一覧。HOME の新着と NEWS で使う。

- 1行は「日付・題・（あれば）タグ」。日付は等幅で `2026.11.06`。分からないときは「日付不明」。
- 題がリンク。行全体を箱で囲まない（細い線で区切るだけ）。
- スマホでは日付が題の上に来る。

```html
<ul class="tr-news">
  <li class="tr-news__item">
    <time class="tr-news__date" datetime="2026-08-30">2026.08.30</time>
    <a class="tr-news__title" href="/news/...">関東夏ロボコン2026に出場しました</a>
    <ul class="tr-tags tr-news__meta"><li><span class="tr-tag">大会</span></li></ul>
  </li>
</ul>
```

使う側が決めるもの：記事の並び（新しい順）、日付、題、タグ。

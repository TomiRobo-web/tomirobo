# Tag

記事の分類と、NEWS の絞り込みに使う小さな札。

- 絞り込みの列では、今選んでいるものに `aria-current="page"`（黒で塗られる）。
- 記事の一覧の中では、押せない札（`span`）として分類を示す。
- 名前は日本語の短い名詞（「大会」「技術ブログ」）。色で種類を分けない。

```html
<ul class="tr-tags">
  <li><a class="tr-tag" href="/news/" aria-current="page">すべて</a></li>
  <li><a class="tr-tag" href="/news/tags/大会/">大会</a></li>
</ul>
```

使う側が決めるもの：タグの名前、リンク先、どれが現在地か。

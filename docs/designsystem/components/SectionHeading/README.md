# SectionHeading

ページの題と、ページ内の区切りの見出し。「英字ラベル＋日本語」の組で書く。

- ページの題：`h1` に `tr-heading tr-heading--page`。1ページに1つ。
- 区切り：`h2` に `tr-heading`。英字ラベル（藍・等幅・大文字）は省いてよい。
- 年度など一覧の区切り：`tr-heading--rule`（下に黒い線）。英字ラベルなし。

```html
<h1 class="tr-heading tr-heading--page">
  <span class="tr-heading__en">About</span>
  <span class="tr-heading__ja">TomiRoboとは</span>
</h1>
```

使う側が決めるもの：英字ラベル（1〜2語）、日本語の見出し、見出しの段（h1〜h3）。

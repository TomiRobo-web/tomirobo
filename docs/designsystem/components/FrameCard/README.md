# FrameCard

ロゴの太い枠を写した、4px の黒い枠の箱。いちばん強い強調。

- **1画面に2つまで**（同じ並びの組は1つと数える）。3つの班、JOIN への誘導など。
- 中身は「英字ラベル（任意）・題・短い説明」。説明は3行まで。
- リンクにするときは箱全体を `a` にする。ホバーで白黒が反転する。
- 角は丸めない。影を付けない。中に別の枠を入れない。

```html
<a class="tr-frame" href="/about/">
  <span class="tr-frame__label">Mechanical</span>
  <h3 class="tr-frame__title">設計班</h3>
  <p class="tr-frame__text">3DCADで機構を設計し、工作機械で形にします。</p>
</a>
```

横に並べるときは `tr-grid` で包む。使う側が決めるもの：ラベル、題、説明、リンク先。

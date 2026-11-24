# Pages CMS の使い方（部員向けガイド）

TomiRobo 公式サイトの固定ページや手動の NEWS 記事は、Git やコードを直接触らずに **Pages CMS** から編集できます。

## 1. Pages CMS を開く手順

1. ブラウザで [https://app.pagescms.org/](https://app.pagescms.org/) を開きます。
2. GitHub アカウントでログインします（`TomiRobo-web/tomirobo` への書き込み権限が必要です）。
3. リポジトリ一覧から **`TomiRobo-web/tomirobo`** を選択します。
4. 画面上部のブランチ選択を確認します。
   - **通常運用（すぐ公開する軽微な修正・手動記事の公開）**：`main` を選択して保存すると、Cloudflare Workers Builds が自動でビルドし本番サイトへ反映されます。
   - **公開前に確認したい変更（協賛企業の追加・大きな文言変更など）**：確認用のブランチを選択（または GitHub で作成）して保存すると、Cloudflare のプレビュー URL で見た目を確認できます。確認後、GitHub でプルリクエストを作成し、`main` にマージすると本番に反映されます。

## 2. 編集できるもの・編集できないもの

### Pages CMS から編集できる対象

- **固定ページ（5 ページ）**：
  - `固定ページ：HOME`（`src/data/pages/home.json`）
  - `固定ページ：ABOUT`（`src/data/pages/about.json`）
  - `固定ページ：JOIN`（`src/data/pages/join.json`）
  - `固定ページ：SPONSOR`（`src/data/pages/sponsor.json`）
  - `固定ページ：CONTACT`（`src/data/pages/contact.json`）
- **NEWS（手動記事）**：
  - `src/content/news/` 直下に置かれる手動投稿の記事（`YYYY-MM-DD-タイトル.md`）。
  - 公開前に確認したい場合は、`下書き（オンにすると非公開）`（`draft`）をオンにして保存してください。
- **画像**：
  - 固定ページ用の画像は `固定ページ画像`（`public/images/pages`）にアップロードされます。
  - 手動 NEWS 記事用の画像は `NEWS 画像`（`public/images/news/uploads`）にアップロードされます。

### 編集してはいけない・表示されない対象

- **旧サイト移行記事（`src/content/news/legacy/`）**：
  - `.pages.yml` で `subfolders: false` を設定しているため、Pages CMS の一覧には表示されず誤って編集できないよう保護されています。
- **esa 同期記事（`src/content/news/esa/`・導入予定）**：
  - こちらも `subfolders: false` により Pages CMS からは編集できません。esa 由来の記事（`source: esa`）を直したい場合は、**esa 側の記事を編集してください**（リポジトリ側で直接書き換えても、次回の同期で上書きされます）。
- **レイアウト・色・フォント・ヘッダー／フッター**：
  - 見た目や部品のルールは `docs/designsystem/` で管理されています。Pages CMS からは変更できません。

## 3. 文章・デザインルール上の注意

サイト全体の一貫性を保つため、編集時は `docs/designsystem/README.md` のルールを守ってください。

- **絵文字は使わない**：本文・見出し・ボタンのどこにも絵文字を入れないでください。
- **「！」は 1 文に 1 つまで**：JOIN や NEWS の元気な文体でも、感嘆符の連打は避けてください。ABOUT・SPONSOR・CONTACT は落ち着いた「です・ます」調にします。
- **協賛企業名の表記**：
  - 企業名は正式名称の後ろに半角スペース＋「様」を付けます（例：`SMC株式会社 様`）。
  - 掲載順は **五十音順** に並べてください。
  - 画像の代替テキスト（`alt`）は企業名から自動生成されます。
- **画像の規定**：
  - 固定ページの画像を差し替える際は、必ず **代替テキスト（`alt`）** と **幅・高さ（`width` / `height`）** を実画像に合わせて更新してください。
  - 他社 SNS のロゴアイコン、素材写真、AI 生成画像は使用しないでください。
  - ポスターやロゴなど、文字や線が見える画像は白背景で読める鮮明なものを用意してください。

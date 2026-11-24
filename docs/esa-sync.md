# esa → GitHub 自動同期

esa の「公開用」カテゴリの記事を、6時間ごとに取り込んでプルリクエスト（PR）にします。**PR を `main` にマージすると本番サイトに公開されます。**

- 処理: `scripts/sync-esa.mjs`（GitHub Actions の `.github/workflows/sync-esa.yml` が動かす）
- 記事の保存先: `src/content/news/esa/esa-<記事番号>.md`
- 画像の保存先: `public/images/news/esa/esa-<記事番号>-<連番>.<拡張子>`

> **注意:** このリポジトリは公開されています。記事は、マージ前でも **PR ができた時点で誰でも見られます**。
> 「公開用」カテゴリには、公開してよい記事と画像だけを入れてください。

## 1. 導入前に必ず行うこと

esa の Owner が、アクセストークンの読める範囲を絞れるか確かめます。

1. `https://<team>.esa.io/user/applications` を開く（`<team>` は esa のチーム名）。
2. PAT v2（Personal access token v2）の作成画面で、アクセスポリシーを **「公開用」カテゴリの読み取りだけ** に制限できるか確認する。
3. 制限できたら、その設定でトークンを作る。書き込み権限は付けない。
4. 制限できないときは、トークンを登録せずに止めて、運用方法をチームで相談する。制限のないトークンが漏れると、esa の内部記事まで読まれてしまう。

スクリプト側でも「WIP でない」「公開用カテゴリにある」ことを確かめますが、トークンの制限の代わりにはなりません。

## 2. GitHub リポジトリの設定

「Settings → Secrets and variables → Actions」で登録します。

| 種類 | 名前 | 必須 | 値 |
|---|---|---|---|
| Secrets | `ESA_ACCESS_TOKEN` | 必須 | 手順1で作ったトークン |
| Variables | `ESA_TEAM` | 必須 | esa のチーム名（`https://<team>.esa.io` の `<team>`） |
| Variables | `ESA_PUBLIC_CATEGORY` | 任意 | 公開するカテゴリ名。省略すると `公開用` |

続けて「Settings → Actions → General → Workflow permissions」で **「Allow GitHub Actions to create and approve pull requests」** をオンにします。オフのままだと PR を作れずに失敗します。

`ESA_ACCESS_TOKEN` か `ESA_TEAM` が未設定の間は、案内をログに出して正常終了します（失敗の通知は来ません）。

## 3. 公開・更新・取り消し

| esa での操作 | サイトへの反映 |
|---|---|
| WIP を外して「公開用」カテゴリ（またはその下）に入れる | 記事が追加される |
| 公開中の記事を書き直す | 記事と画像が更新される |
| WIP に戻す／別のカテゴリへ移す／Archive する／削除する | 記事と画像が消える |

どの操作も、次の同期で PR になり、**PR をマージしたときに**本番へ反映されます。

1. PR の「Files changed」と Cloudflare のプレビューで内容を確認する。
2. 公開してよければマージする。
3. 直すところがあれば、**esa 側の記事を直す**。PR のブランチ `esa-sync/auto` は次の同期で上書きされる。

マージ前に esa 側の変更が取り消され、`main` と同じ内容に戻ったときは、開いている PR を自動で閉じます。

そのほかの決まり:

- 日付は esa の作成日（日本時間）、執筆者は esa の作成者名です。
- タグは esa のタグに、サブカテゴリ名を足したものです（例: `公開用/技術ブログ` → `技術ブログ`）。
- 取り込む画像は esa にアップロードしたものだけです。ほかのサイトの画像は URL のまま残ります。画像以外の添付ファイルは取り込みません。
- 手動で書いた記事と `src/content/news/legacy/` には触れません。対象は `src/content/news/esa/` と `public/images/news/esa/` の `esa-<記事番号>` のファイルだけです。

## 4. すぐに同期したいとき

1. GitHub の「Actions」→「esa 同期」→「Run workflow」を開く。
2. ブランチは `main` のまま、「Run workflow」を押す。

### すべての記事を取り下げるとき（空同期の許可）

公開対象が0件になると、事故で全記事が消えるのを防ぐため、同期は失敗して止まります。本当に全部消すときだけ、上の手順2でチェック欄（公開対象が0件でも実行し、…）をオンにして実行し、できた PR をマージします。

## 5. 緊急で取り消したいとき

1. **esa で**、記事を WIP に戻すか「公開用」の外へ移す。先にこれをしないと、次の同期でまた PR になる。
2. まだマージしていなければ、PR を閉じて `esa-sync/auto` ブランチを削除する。
3. すでに公開されていれば、「Run workflow」で同期し、できた PR をすぐにマージする。それが最後の公開記事なら、空同期の許可もオンにする。同期が動かないときは、`src/content/news/esa/esa-<記事番号>.md` と `public/images/news/esa/esa-<記事番号>-*` を消す PR を手で作ってマージする。
4. 本番サイトで記事と画像の URL が消えたことを確認する。

> **消しても履歴には残ります。** 一度 push された内容は、Git の履歴や閉じた PR、Cloudflare の過去のプレビューから見られることがあります。個人情報などを出してしまったときは、リポジトリの管理者が履歴からの削除や GitHub サポートへの依頼を検討してください。

トークンが漏れた疑いがあるときは、まず esa の `https://<team>.esa.io/user/applications` でトークンを無効にします。

## 6. 困ったとき

| 症状 | 確認すること |
|---|---|
| `HTTP 401` / `HTTP 403` | トークンの期限・権限・カテゴリ制限、`ESA_TEAM` の値 |
| `HTTP 429` / `HTTP 5xx` | esa 側の制限か障害。時間をおいて実行し直す |
| `公開対象の記事が0件` | カテゴリ名（`ESA_PUBLIC_CATEGORY`）と、記事が WIP になっていないか |
| 画像を取得できない・対応していない形式 | 記事の画像が esa で表示できるか。対応形式は png / jpeg / gif / webp / svg / avif |
| 画像が大きすぎます | 1枚 20 MiB まで。esa 側で画像を縮小して差し替える |
| PR が作られない | 手順2の「Allow GitHub Actions to create and approve pull requests」 |
| 定期実行が止まった | 公開リポジトリは60日間動きがないと定期実行が止まる。Actions の画面で有効に戻す |

取得の途中で失敗したときは、記事も画像も変更しません。

## 7. 手元で動かす

Node.js は `.node-version` を参照してください。

```sh
npm test   # 同期処理のテスト（外部へは通信しない）
ESA_ACCESS_TOKEN=... ESA_TEAM=... npm run sync:esa   # 実際に取り込む
```

トークンをファイルに書いてコミットしないでください。

# Rental Watch

中央区・清澄白河・森下・菊川周辺の、同棲向け賃貸候補を同じURLで追跡する静的ダッシュボードです。`portfolio` リポジトリとは完全に独立しています。

## 技術構成

- 静的 HTML / CSS / JavaScript（バックエンド不要）
- JSON を唯一のデータソースに使用
- `src/types.ts` に JSON スキーマの TypeScript 型を定義
- GitHub Actions で GitHub Pages に自動デプロイ

## ローカル起動

依存関係はありません。リポジトリ直下で任意の静的サーバーを起動します。

```bash
python -m http.server 8000
```

`http://localhost:8000` を開いてください。`file://` 直開きでは JSON の読み込みがブラウザにより制限されるため、静的サーバーを使います。

## GitHub Pages 公開

`.github/workflows/deploy.yml` は `main` への push を検知して Pages を更新します。GitHub の **Settings → Pages → Build and deployment** で Source を **GitHub Actions** に設定してください。公開URLは `https://hirakawashion3d-ux.github.io/rental-watch/` のまま変わりません。

## 更新方法

1. `data/properties.json` の現行候補を追加または更新します。
2. `data/updates.json` の先頭へ更新履歴を追加します。
3. `main` へ commit / push します。
4. GitHub Actions が同一URLのページを自動更新します。

```bash
git add data/properties.json data/updates.json
git commit -m "Update rental listings"
git push
```

### 物件を追加する

`properties.json` に `Property` オブジェクトを追加します。`id` はページ内アンカーにも使うため、英小文字・数字・ハイフンで一意にします。初回検出日時は `firstSeenAt`、確認ごとに `lastCheckedAt`、内容変更ごとに `updatedAt` を日本時間の ISO 8601 で更新します。

画像URLを安定して取得できない場合は、推測した画像URLや一時URLを保存しません。代わりに、問い合わせ可能な物件ページURLを `links` に保持します。

### 物件を更新する

金額、状態、URL、設備、評価を変更し、`updatedAt` と `lastCheckedAt` を更新します。同時に `updates.json` へ `propertyId` を結び付けた更新レコードを追加します。

外部URLはカード内で常時確認できるよう、確証のあるページを `links` に残します。参考ページは `status: "reference"`、要再確認は `status: "needs_confirmation"` とします。

### 掲載終了を除外する

掲載終了・成約済み・問い合わせ不可を確認した物件は、`properties.json` からオブジェクトごと削除します。`status: "ended"` や `rank: "ENDED"` のカードとして残しません。

削除と同時に `updates.json` の先頭へ `type: "ended"` の履歴を追加します。確認に使用した外部URLは、その更新レコードの `links` に保持します。これにより現行候補一覧を汚さず、終了判断の根拠だけを追跡できます。

### ランクを変更する

`rank` を `A` / `B` / `CHECK` / `HOLD` のいずれかに変え、`updates.json` に `type: "rank_change"` と変更前後を記録します。ランキングは `A → B → CHECK → HOLD`、同ランク内は `lastCheckedAt` の新しい順です。

## JSON フィールド

主要フィールドは `src/types.ts` の `Property` / `PropertyUpdate` を正とします。必須の判断用フィールドは `id`、`name`、`rank`、`status`、`summary`、`areaName`、`totalMonthlyCost`、`layout`、`area`、`stations`、`links`、各日時です。情報が未確認の場合はフィールドを省略でき、画面では「未確認」と表示されます。設備は `amenities` に確証のあるものだけを入れてください。

## 同一URLで更新され続ける仕組み

リポジトリ名と GitHub Pages の公開先は固定です。`main` の変更が同じ Pages 環境へデプロイされるため、物件データだけを更新してもブックマーク先URLは変わりません。

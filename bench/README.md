# Web Speed Hackathon 2025 Scoring Tool

"Web Speed Hackathon 2025" は、非常に重たい Web アプリをチューニングして、いかに高速にするかを競う競技です。

- 課題レポジトリ: https://github.com/CyberAgentHack/web-speed-hackathon-2025

このレポジトリは、"Web Speed Hackathon 2025" の Web アプリのパフォーマンスを計測するツールです。

## 使い方

### ローカルで動かす場合

- Chrome をインストールします
- レポジトリをローカルに clone します
- スコアリングツールに計測したい URL を与えて実行します
  - ```shell
    $ pnpm start --applicationUrl <applicationUrl>
    ```

### GitHub Actions で動かす場合

- レポジトリの issue から「参加登録」を選びます
- 自動で issue に結果が投稿されます、再実行するには `/retry` とコメントします

### 個人で大会を開く場合

- ダッシュボードを構築します
  - `POST /api/scores/:userId`
    - headers: `Token`
    - body: `{ "score": <number> }`
- このレポジトリを fork します
- レポジトリの issue タグに `registration` を作ります
- `.github/workflows/request.yml` のコマンドに「開催期間」「ダッシュボード URL / token」を設定します
  - 詳しくは `pnpm start --help` を参照してください
- レポジトリの issue から「参加登録」を実行して挙動確認します

## LICENSE

MPL-2.0 (c) CyberAgent

# Web Speed Hackathon 2025 Scoring Tool

限界開発鯖で開催予定の WSH2025 感想戦のためのコードを格納するレポジトリです。

- 公式様: https://github.com/CyberAgentHack/web-speed-hackathon-2025-scoring-tool
- スコアボード: https://approvers.github.io/web-speed-hackathon-2025-scoring-tool/

## 特記すべき upstream からの変更点

- Actions で抜けている引数周りを追加 [pkind](https://github.com/approvers/web-speed-hackathon-2025-scoring-tool/commit/09de7919f3638f98b3e08201e1b0a75d3865582c), [ghid](https://github.com/approvers/web-speed-hackathon-2025-scoring-tool/commit/9de32eff9374ccd07607e84cb64a88f9d7dd7cfe)
- コンテスト時間制限を撤廃
- Lighthouse の各メトリクスを Issue に出す
  - 本番中にも GitHub Actions のログで見えてたので
- スコア永続化周り
- オリジナルスコアボード

## セルフホストしたい方へ

本家と違いスコアボードのソースコードもセットとなっているため、より少ない労力で大会を開催可能かと思います。ライセンスの範囲内でご自由にお使いください。

1. このレポジトリをお好きな場所に複製してください。fork で無くて結構です。
1. supabase をセットアップし、`misc/table.sql` を実行してテーブルを作成します。
1. supabase の service key に scores の select/insert, anon key に select を許可します。
1. GitHub のレポジトリ設定から下記の必要な変数を設定します。
1. 何かしら main にコミットすると、GitHub Pages を用いてスコアボードのデプロイが行われます。
1. 大会名等お好みでソースコードを変更してください。
1. 使用される場合は [作者](https://x.com/kawason0708) に教えてもらえると大変嬉しいです。必須ではありません。

### 必要なレポジトリ変数

| 種類                | 名前                 | 説明                           |
| :------------------ | :------------------- | :----------------------------- |
| Repository Secret   | SUPABASE_SERVICE_KEY | Supabase のサービスキー        |
| Repository Variable | SUPABASE_ANON_KEY    | Supabase の匿名キー            |
| Repository Variable | SUPABASE_URL         | Supabase のプロジェクトの　URL |

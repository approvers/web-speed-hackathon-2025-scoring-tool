# Web Speed Hackathon 2025 Scoring Tool

限界開発鯖内で開催予定の WSH2025 感想戦のためのコードを格納するレポジトリです。

- 公式様: https://github.com/CyberAgentHack/web-speed-hackathon-2025-scoring-tool
- スコアボード: https://approvers.github.io/web-speed-hackathon-2025-scoring-tool/

## 特記すべき upstream からの変更点

- Actions で抜けている引数周りを追加 [pkind](https://github.com/approvers/web-speed-hackathon-2025-scoring-tool/commit/09de7919f3638f98b3e08201e1b0a75d3865582c), [ghid](https://github.com/approvers/web-speed-hackathon-2025-scoring-tool/commit/9de32eff9374ccd07607e84cb64a88f9d7dd7cfe)
- コンテスト時間制限を撤廃
- Lighthouse の各メトリクスを Issue に出す
  - 本番中にも GitHub Actions のログで見えてたので
- スコア永続化周り
- オリジナルスコアボード

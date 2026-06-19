# CLAUDE.md

全日本AIハッカソン2026 予選4thラウンド（オンライン）のプロジェクト。
Next.js (App Router) + TypeScript を Vercel にデプロイする。テーマは当日発表・その場制作・約3時間。

## このファイルは「地図」。中身は別の場所にある
ここにルールは書かない。何がどこにあるかだけを示す。

- **何を作るか**（仕様 兼 基本設計）: `docs/spec.md` ← セッション開始時に必ず読む
- **全タスク共通の判断・進め方**: `.claude/rules/meta/base.md`（自動で読み込まれる）
- **コーディング規約・完了条件**: `.claude/rules/coding/nextjs.md`（`app/` `lib/` `components/` を触ると自動で読み込まれる）
- **雛形を最速で立てる手順**: `scaffold-app` スキル（当日テーマ確定後の最初の一歩で使う）

## モジュール構成
- `app/` — ルーティング・ページ。`app/api/.../route.ts` にサーバー処理（LLM呼び出し含む）
- `lib/` — ロジック・型・APIクライアント（にゃんこ2 / Claude Code 担当）
- `components/` — UI（相方 / Codex 担当）

## 担当
にゃんこ2（このエージェントのユーザー）は 仕様 → 基本設計 → ロジック/API 側。
相方は **Codex** を使い UI/デザイン/紹介動画/磨き込みを担当。同じリポジトリなので相方の領域（`components/`・スタイル）には断りなく触らない。

## コマンド
```bash
npm run dev      # ローカル開発
npm run build    # 本番ビルド確認
npm run lint     # Lint
git push         # main へ push すると Vercel が自動デプロイ
```

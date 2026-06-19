# AGENTS.md

> Codex 用の指示ファイル（相方用）。Claude Code 側は CLAUDE.md を見る。

全日本AIハッカソン2026 予選4thラウンド（オンライン）のプロジェクト。
Next.js (App Router) + TypeScript を Vercel にデプロイ。テーマは当日発表・その場制作・約3時間。

## セッション開始時に必ず読むファイル
Codex は `.claude/rules/` を自動では読み込まない（あれは Claude Code 固有の仕組み）。
そのため、開始時に自分で以下を読むこと:
- `docs/spec.md` — 何を作るか（仕様 兼 基本設計）
- `.claude/rules/meta/base.md` — 全タスク共通の判断基準・進め方・報告形式
- UI/スタイルを書くときは `.claude/rules/coding/nextjs.md` も読む（規約と完了条件）

## 絶対に外さない3点（詳細は上のルールファイル）
- **完了 = Vercel のURLでブラウザから動くこと**。ローカル動作だけは未完了。
- **過剰設計をしない**。今必要な最小実装だけ。
- **APIキーは絶対にコミットしない**。

## 担当
相方（このエージェントのユーザー）は UI/デザイン/動画/磨き込み → `components/`・スタイル。
もう一人は Claude Code で ロジック/API。相手の領域（`lib/`, `app/api/`）には断りなく触らない。
共有ファイル（`app/layout.tsx`・設定・`package.json`）を触るときは一言。

## モジュール構成
- `app/` ページ・ルーティング / `app/api/` サーバー処理
- `lib/` ロジック・型・APIクライアント
- `components/` UI

## コマンド
```bash
npm run dev      # ローカル開発
npm run build    # 本番ビルド確認
npm run lint     # Lint
git push         # main へ push すると Vercel が自動デプロイ
```

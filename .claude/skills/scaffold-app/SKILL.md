---
name: scaffold-app
description: Next.js(App Router)+TypeScript+Tailwind の雛形をゼロから立て、Vercelへの初回デプロイ確認まで通すスキル。「環境作って」「雛形作って」「プロジェクト立ち上げて」「セットアップして」「最初のデプロイまでやって」と言われたとき、特にハッカソン当日テーマ確定後の最初の一歩で使う。create-next-app の実行 → docs/ と app/page.tsx を最小整備 → 初回 commit & push → Vercel の URL で表示確認、までを実行する。
---

# scaffold-app

ハッカソン当日、テーマが決まり `docs/spec.md` の MVP が固まったら、このスキルで土台を最短で作る。
ここで作るのは「動く空箱を Vercel に出す」ところまで。機能は spec.md の MVP に従って別途実装する。

## 手順

1. 既存リポジトリ直下で Next.js を初期化する（空リポジトリがある前提）。例:
   ```bash
   npx create-next-app@latest . --typescript --tailwind --app --eslint
   ```
   ※ フラグはバージョン依存。エラーが出たらフラグ無し `npx create-next-app@latest .` の対話モードで「TypeScript / Tailwind / App Router あり」を選ぶ。

2. `docs/` に仕様書（`spec.md`）があることを確認。`CLAUDE.md` `AGENTS.md` `.claude/rules/` は既にある前提。

3. `.env.local` を作成（APIキー用）。`.gitignore` に `.env*` が含まれていることを確認。

4. `app/page.tsx` を「MVP の入口」だけの最小状態にする（過剰な雛形は足さない）。

5. 初回コミット & push:
   ```bash
   git add -A && git commit -m "chore: 初期セットアップ" && git push
   ```

6. Vercel の自動デプロイ URL を開き、ブラウザで表示されることを確認（= ここで初めて土台完成）。

## 注意
- LLM 呼び出しは `app/api/.../route.ts` に置き、キーは環境変数から読む。コミットしない。
- 依存追加・共有ファイル変更は `.claude/rules/meta/base.md` に従い、必要なら人間に一言。

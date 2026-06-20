// AIセリフ生成エンドポイント（spec §10, §11）。Node ランタイムで Claude を呼び、
// キーを秘匿。開始口上 / 結果コメントのみ生成（毎フレームは呼ばない）。
// タイムアウト・失敗・キー未設定時は定型文プールへフォールバック（lib/messages.ts）。
import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { OPENING_LINES, pickLine, resultComment } from "@/lib/messages";

export const runtime = "nodejs";

// 短いセリフ生成に十分・速い・安い（spec §10）。
const MODEL = "claude-haiku-4-5-20251001";
const TIMEOUT_MS = 8000;

// ---- API 入出力の型（境界には必ず型 / nextjs.md） ----
type AiRequest =
  | { kind: "opening" }
  | {
      kind: "result";
      cleared: boolean;
      shinayaka: number;
      soft: number;
      hard: number;
    };

interface AiResponse {
  text: string;
  source: "llm" | "fallback"; // 生成元（デバッグ・確認用）
}

// 入力ごとの定型文フォールバック。
function fallbackFor(body: AiRequest): string {
  if (body.kind === "opening") return pickLine(OPENING_LINES);
  return resultComment(body.cleared, body.shinayaka);
}

// 入力ごとのプロンプト。AIキャラ＝命令されて怒り、優しさで鎮まる存在。
function buildPrompt(body: AiRequest): { system: string; user: string } {
  const system =
    "あなたはゲーム『YAWARAi』のキャラクター。普段ユーザーに強い言葉や無理な命令を投げられて怒っているAI。" +
    "出力は日本語の短い話し言葉のセリフ1文のみ（40文字以内）。説明・前置き・絵文字・かぎ括弧は付けない。";
  if (body.kind === "opening") {
    return {
      system,
      user: "ゲーム開始の怒りの口上を1文。これから硬い言葉を投げ返すぞ、という挑発的なトーンで。",
    };
  }
  const status = body.cleared ? "プレイヤーの優しさで怒りが鎮まった" : "時間切れでまだ少し硬さが残る";
  return {
    system,
    user:
      `結果: ${status}。しなやか度${body.shinayaka}%（柔を${body.soft}回受け止め、硬に${body.hard}回当たった）。` +
      "この結果を踏まえ、態度をやわらげAIからプレイヤーへ贈る一言を1文。感謝や歩み寄りのトーンで。",
  };
}

export async function POST(req: Request): Promise<NextResponse<AiResponse>> {
  let body: AiRequest;
  try {
    body = (await req.json()) as AiRequest;
  } catch {
    return NextResponse.json({ text: pickLine(OPENING_LINES), source: "fallback" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  // キー未設定なら即フォールバック（ローカルでキー無しでも動く）。
  if (!apiKey) {
    return NextResponse.json({ text: fallbackFor(body), source: "fallback" });
  }

  try {
    const client = new Anthropic({ apiKey });
    const { system, user } = buildPrompt(body);
    const msg = await client.messages.create(
      {
        model: MODEL,
        max_tokens: 120,
        system,
        messages: [{ role: "user", content: user }],
      },
      { timeout: TIMEOUT_MS },
    );
    // text ブロックを取り出す。
    const text = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    if (!text) {
      return NextResponse.json({ text: fallbackFor(body), source: "fallback" });
    }
    return NextResponse.json({ text, source: "llm" });
  } catch {
    // タイムアウト・レート制限・障害などはすべて定型文へ（spec §12-2）。
    return NextResponse.json({ text: fallbackFor(body), source: "fallback" });
  }
}

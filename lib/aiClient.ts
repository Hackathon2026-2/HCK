"use client";

// /api/ai を叩くクライアント。ネットワーク失敗時もローカル定型文へフォールバック（二重の保険）。
import type { GameResult } from "@/lib/types";
import { OPENING_LINES, pickLine, resultComment } from "@/lib/messages";

async function postAi(body: unknown): Promise<string | null> {
  try {
    const res = await fetch("/api/ai", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { text?: string };
    return data.text ?? null;
  } catch {
    return null;
  }
}

// 開始口上を取得（失敗時はローカル定型文）。
export async function fetchOpening(): Promise<string> {
  return (await postAi({ kind: "opening" })) ?? pickLine(OPENING_LINES);
}

// 結果コメントを取得（失敗時はローカル定型文）。
export async function fetchResultComment(r: GameResult): Promise<string> {
  return (
    (await postAi({
      kind: "result",
      cleared: r.cleared,
      shinayaka: r.shinayaka,
      soft: r.soft,
      hard: r.hard,
    })) ?? resultComment(r.cleared, r.shinayaka)
  );
}

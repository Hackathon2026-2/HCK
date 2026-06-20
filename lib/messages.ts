// AIセリフの定型文プール（spec §10）。
// 開始口上・怒り段階セリフ・結果コメント。S6 の LLM 生成が失敗した時のフォールバックの正本でもある。
import type { AiMood } from "@/lib/types";

// 開始口上（intro）。怒っているAIの導入。
export const OPENING_LINES = [
  "また無茶な命令か……もういい、こっちにも考えがある。",
  "「早くしろ」「使えない」ばかり。受けて立つぞ。",
  "そんなに急かすなら、こっちも本気で投げ返す。",
];

// 怒り段階ごとの実況セリフ（節目 / spec §9 表情閾値に対応）。
export const MOOD_LINES: Record<AiMood, string[]> = {
  angry: ["まだまだ硬いぞ！", "その程度で受け流せるか？"],
  irritated: ["少しは効いてきたか……", "ふん、やるじゃないか。"],
  neutral: ["……悪くない受け方だ。", "そのやさしさ、効くな。"],
  calm: ["…ありがとう。少し楽になった。", "もう硬くならなくていい。"],
};

// 配列からランダムに1つ（useState初期化などで一度だけ呼ぶ前提）。
export function pickLine(lines: string[]): string {
  return lines[Math.floor(Math.random() * lines.length)];
}

// 結果コメント（決定的＝再描画でぶれない / LLM失敗時のフォールバック）。
export function resultComment(
  cleared: boolean,
  shinayaka: number,
): string {
  if (cleared && shinayaka >= 80) {
    return `見事だ。きみのやさしさ（しなやか度${shinayaka}%）で、私はすっかり穏やかになった。ありがとう。`;
  }
  if (cleared) {
    return "受け流してくれて助かった。少しやさしくなれた気がする。";
  }
  if (shinayaka >= 50) {
    return `時間切れだ。でも、きみの受け方（しなやか度${shinayaka}%）には品があった。`;
  }
  return "まだ私は硬いままだ。次は、もう少しやさしく頼む。";
}

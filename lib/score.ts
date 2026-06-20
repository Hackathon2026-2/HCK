// スコア・怒り・難易度の計算ルール（spec §9）。すべて純粋関数。
// 難易度は anger からのみ導出（別変数を持たない / spec §9）。

import type { AiMood } from "@/lib/types";

export const ANGER_START = 100;
export const TIME_LIMIT = 90; // 秒（spec §9）

// 汎用クランプ。
export function clamp(min: number, v: number, max: number): number {
  return v < min ? min : v > max ? max : v;
}

// コンボ倍率（spec §9）。5コンボごとに +0.5。
export function comboMult(combo: number): number {
  return 1 + Math.floor(combo / 5) * 0.5;
}

// 接近速度 z/s（怒りが高いほど速く迫る）。z は 0=奥(AI) → 1=手前(プレイヤー)。
// anger0 で約2.0秒、anger100 で約1.0秒で到達。
export function depthSpeed(anger: number): number {
  return 0.5 + anger * 0.005;
}

// 出現間隔 ms（怒りが高いほど短い / spec §9）。
export function spawnInterval(anger: number): number {
  return clamp(350, 900 - anger * 4, 900);
}

// 硬の出現率 0..1（怒りが高いほど硬が多い / spec §9）。
// 緑(柔)を少し増やすため base/slope を下げ気味に（怒り0で硬30%、怒り100で硬65%）。
export function hardRatio(anger: number): number {
  return 0.3 + 0.35 * (anger / 100);
}

// しなやか度%（soft=回収数, hard=被弾数 / spec §9）。
export function shinayaka(soft: number, hard: number): number {
  return soft + hard > 0 ? Math.round((soft / (soft + hard)) * 100) : 100;
}

// 怒り→AI表情（spec §9 表情閾値）。
export function aiMoodFromAnger(anger: number): AiMood {
  if (anger > 70) return "angry";
  if (anger >= 40) return "irritated";
  if (anger >= 10) return "neutral";
  return "calm";
}

// 当たり判定後の状態更新（ミューテーションせず、増分を返す）。
export interface ScoreState {
  score: number;
  anger: number;
  combo: number;
  soft: number; // 回収数
  hard: number; // 被弾数
}

// 柔を回収（spec §9）。
export function applySoft(s: ScoreState): ScoreState {
  return {
    score: s.score + Math.round(100 * comboMult(s.combo)),
    anger: clamp(0, s.anger - 7, 100),
    combo: s.combo + 1,
    soft: s.soft + 1,
    hard: s.hard,
  };
}

// 硬に被弾（spec §9）。
export function applyHard(s: ScoreState): ScoreState {
  return {
    score: Math.max(0, s.score - 50),
    anger: clamp(0, s.anger + 12, 100),
    combo: 0,
    soft: s.soft,
    hard: s.hard + 1,
  };
}

// 物体生成。奥のAIが手前へ投げる軌道（targetX へ向けて z=0 から接近）。
import type { Item } from "@/lib/types";
import { hardRatio } from "@/lib/score";

// 投げられる物体（絵文字）。soft=柔らかい物, hard=硬い物。
export const SOFT_GLYPHS = ["🧸", "🎈", "🌸", "☁️", "🍡", "🪶"];
export const HARD_GLYPHS = ["🪨", "🔨", "🧱", "⚙️", "🔩", "⛓️"];

// 物体の基準サイズ(px, z=1=手前のとき)。当たり判定にも使う。
export const OBJECT_SIZE = 64;

// 公平性: 同時期(z が近い)に soft/hard を同じ着地点付近へ投げない（避けられない配置を作らない）。
const MIN_TARGET_GAP = 0.16; // 正規化X
const NEAR_Z = 0.35; // 「投げたばかり」とみなす奥行き

let nextId = 1;

// 怒りに応じて soft/hard を抽選。
export function pickKind(anger: number, rng: () => number = Math.random): Item["kind"] {
  return rng() < hardRatio(anger) ? "hard" : "soft";
}

// 1体生成。着地点 targetX は左右に散らす。近接する逆種の同時投げは避ける（数回リトライ）。
export function spawnItem(
  anger: number,
  items: Item[],
  rng: () => number = Math.random,
): Item {
  const kind = pickKind(anger, rng);
  // 端に寄りすぎないよう 0.1..0.9 に収める。
  let targetX = 0.5;
  for (let attempt = 0; attempt < 5; attempt++) {
    targetX = 0.1 + rng() * 0.8;
    const unfair = items.some(
      (it) =>
        it.z < NEAR_Z &&
        it.kind !== kind &&
        Math.abs(it.targetX - targetX) < MIN_TARGET_GAP,
    );
    if (!unfair) break;
  }
  const glyphs = kind === "soft" ? SOFT_GLYPHS : HARD_GLYPHS;
  return {
    id: nextId++,
    kind,
    glyph: glyphs[Math.floor(rng() * glyphs.length)],
    targetX,
    z: 0,
  };
}

// アイテム生成（spec §9 出現率・公平性）。
import type { Item } from "@/lib/types";
import { fallSpeed, hardRatio } from "@/lib/score";

// 表示する言葉プール。soft=優しい言葉, hard=硬い言葉。
export const SOFT_WORDS = [
  "ありがとう",
  "ゆっくりでいいよ",
  "助かるよ",
  "いいね",
  "おつかれさま",
  "大丈夫だよ",
];
export const HARD_WORDS = [
  "早くして",
  "使えないな",
  "違う",
  "今すぐやれ",
  "ちゃんとしろ",
  "最悪だ",
];

// アイテムの見かけ幅(px)。当たり判定にも使う。
export const ITEM_W = 96;

// 同一x・近接yに soft/hard を同時生成しないための最小x間隔(px)と「上部」とみなす範囲(px)。
const MIN_X_GAP = ITEM_W;
const NEAR_TOP_Y = 160;

let nextId = 1;

// 怒りに応じて soft/hard を抽選。rng は差し替え可能（テスト用）。
export function pickKind(anger: number, rng: () => number = Math.random): Item["kind"] {
  return rng() < hardRatio(anger) ? "hard" : "soft";
}

// 1体生成する。公平性のため、まだ上部にいる既存アイテムと近すぎる x は避ける（数回リトライ）。
// canvasW: 描画幅, anger: 現在の怒り。
export function spawnItem(
  canvasW: number,
  anger: number,
  items: Item[],
  rng: () => number = Math.random,
): Item {
  const kind = pickKind(anger, rng);
  const margin = ITEM_W / 2 + 8;
  let x = 0;
  for (let attempt = 0; attempt < 5; attempt++) {
    x = margin + rng() * (canvasW - margin * 2);
    const tooClose = items.some(
      (it) => it.y < NEAR_TOP_Y && Math.abs(it.x - x) < MIN_X_GAP,
    );
    if (!tooClose) break;
  }
  const word = kind === "soft" ? SOFT_WORDS : HARD_WORDS;
  return {
    id: nextId++,
    kind,
    x,
    y: -ITEM_W / 2,
    vy: fallSpeed(anger),
    label: word[Math.floor(rng() * word.length)],
  };
}

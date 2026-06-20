// 当たり判定（spec §8）。
import type { Item } from "@/lib/types";
import { ITEM_W } from "@/lib/spawn";

export const CATCHER_W = 120; // キャッチャー幅(px)（spec §8）
export const BAND_H = 90; // キャッチ帯の高さ(px)

// アイテムがキャッチ帯に入り、かつキャッチャーと横方向で重なれば接触（spec §8）。
// playerXpx: キャッチャー中心x(px), canvasH: 描画高さ。
export function isCaught(
  item: Item,
  playerXpx: number,
  canvasH: number,
): boolean {
  const bandTop = canvasH - BAND_H;
  if (item.y < bandTop) return false; // まだ帯に届いていない
  return Math.abs(item.x - playerXpx) < (CATCHER_W + ITEM_W) / 2;
}

// 画面下端を通り過ぎた（取り逃した）か。
export function isOffscreen(item: Item, canvasH: number): boolean {
  return item.y - ITEM_W / 2 > canvasH;
}

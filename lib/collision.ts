// 当たり判定（奥行きモデル）。物体が手前(z>=1)に到達した瞬間、
// 着地点 targetX とキャッチャー中心 playerX が重なれば接触。
import type { Item } from "@/lib/types";
import { OBJECT_SIZE } from "@/lib/spawn";

export const CATCHER_W = 140; // キャッチャー幅(px)

// 物体が手前のプレイヤー面に到達したか。
export function hasArrived(item: Item): boolean {
  return item.z >= 1;
}

// 到達した物体がキャッチャーと横方向で重なるか。
// playerXpx: キャッチャー中心x(px), canvasW: 描画幅。
export function isCaught(item: Item, playerXpx: number, canvasW: number): boolean {
  const targetPx = item.targetX * canvasW;
  return Math.abs(targetPx - playerXpx) < (CATCHER_W + OBJECT_SIZE) / 2;
}

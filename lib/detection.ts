// カメラ動き検出（spec §8）。骨格認識は使わず、縮小フレームの差分で横位置を推定する。
// ここは純粋ロジック（DOM非依存）。React 連携は lib/usePlayerX.ts 側。

// 検出用オフスクリーンの解像度（小さくして軽量に / spec §8-1）。
export const DETECT_W = 160;
export const DETECT_H = 120;

// 差分の2値化しきい値（グレースケール 0..255 の差）。
const DIFF_THRESHOLD = 30;
// この画素数を超えて初めて「動き有り」とみなす（ノイズ無視）。
const MIN_MOTION_PIXELS = 40;
// EMA の平滑化係数（spec §8-3, α≈0.3）。
export const EMA_ALPHA = 0.3;

// 直前フレームと現フレームのグレースケール差分から、変化画素の横方向重心を 0..1 で返す。
// 動きが少なすぎる場合は null（＝更新しない）。
export function computeMotionX(
  prev: ImageData,
  curr: ImageData,
): number | null {
  const a = prev.data;
  const b = curr.data;
  const w = curr.width;
  const h = curr.height;
  let sumX = 0;
  let count = 0;
  // 4画素ずつ（RGBA）走査。グレースケールは簡易に (R+G+B)/3。
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4;
      const g1 = (a[i] + a[i + 1] + a[i + 2]) / 3;
      const g2 = (b[i] + b[i + 1] + b[i + 2]) / 3;
      if (Math.abs(g1 - g2) > DIFF_THRESHOLD) {
        sumX += x;
        count++;
      }
    }
  }
  if (count < MIN_MOTION_PIXELS) return null;
  return sumX / count / w; // 0..1
}

// 指数移動平均で平滑化（ジッター抑制 / spec §8-3）。
export function ema(prev: number, next: number, alpha = EMA_ALPHA): number {
  return prev + alpha * (next - prev);
}

// 0..1 を左/中/右の3レーン中心（0.2 / 0.5 / 0.8）に離散化（ジッター時の安定化 / spec §8-4）。
export function snapToLane(x: number): number {
  if (x < 1 / 3) return 0.2;
  if (x < 2 / 3) return 0.5;
  return 0.8;
}

// 0..1 にクランプ。
export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

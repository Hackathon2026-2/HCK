// YAWARAi の中核型（spec §7）。
// 毎フレーム更新するものは GameRef（ref管理・再描画しない）、画面/HUD は React state に分ける。

export type Phase = "start" | "intro" | "camera" | "playing" | "result";

// AIの機嫌。anger から導出（spec §9 表情閾値）。
export type AiMood = "angry" | "irritated" | "neutral" | "calm";

// 入力方式。カメラ不可時は keyboard / mouse にフォールバック。
export type InputMode = "camera" | "keyboard" | "mouse";

// 画面に出す（間引いて state 反映する）HUD 状態。
export interface HudState {
  score: number;
  anger: number; // 0..100
  shinayaka: number; // 0..100 (%)
  timeLeft: number; // 秒
  combo: number;
}

// 落下アイテム。soft=優しい言葉(回収), hard=硬い言葉(被弾)。
export interface Item {
  id: number;
  kind: "soft" | "hard";
  x: number; // ピクセル（ゲームcanvas座標）
  y: number; // ピクセル
  vy: number; // px/s
  label: string; // 表示する言葉
}

// ゲーム終了時の結果（result 画面・AIコメント生成に渡す）。
export interface GameResult {
  score: number;
  shinayaka: number; // %
  soft: number; // 回収数
  hard: number; // 被弾数
  cleared: boolean; // true=怒り沈静でクリア / false=時間切れ
}

// 毎フレーム更新する可変状態（再描画しないので ref に置く）。
export interface GameRef {
  playerX: number; // 0..1（正規化された横位置）
  items: Item[];
  lastSpawnMs: number;
  running: boolean;
  prevFrame?: ImageData; // 動き検出用の直前フレーム画素
}

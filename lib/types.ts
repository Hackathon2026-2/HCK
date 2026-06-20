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

// 投げられる物体。soft=柔らかい物(回収), hard=硬い物(被弾)。
// 奥(AI)→手前(プレイヤー)へ z が進むほど大きく・外側へ向かう疑似3D。
export interface Item {
  id: number;
  kind: "soft" | "hard";
  glyph: string; // 物体の見た目（絵文字）
  targetX: number; // 着地点の正規化X(0..1)（プレイヤー面）
  z: number; // 奥行き 0(AI付近)→1(プレイヤー面)
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

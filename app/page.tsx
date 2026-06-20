"use client";

// YAWARAi フェーズ管理。
// start(start.png) → intro(start_1.mp4 全画面) → playing(BGM) → result。
// 「スタート」で動画再生＋音声解錠＋カメラ要求（裏で）、動画終了で playing に移行し BGM 開始。
// カメラ拒否時は keyboard ←→ にフォールバック（spec §5, §12-5）。
// 各画面の見た目・AIキャラ・HUD演出は Codex が差し替える前提（暫定UI）。

import { useEffect, useState } from "react";
import type { GameResult, HudState, InputMode, Phase } from "@/lib/types";
import { useCamera } from "@/lib/useCamera";
import { usePlayerX } from "@/lib/usePlayerX";
import { GameCanvas } from "@/components/GameCanvas";
import { aiMoodFromAnger, ANGER_START, TIME_LIMIT } from "@/lib/score";
import { MOOD_LINES, resultComment } from "@/lib/messages";
import { fetchResultComment } from "@/lib/aiClient";
import { useBgm } from "@/lib/useBgm";

const INITIAL_HUD: HudState = {
  score: 0,
  anger: ANGER_START,
  shinayaka: 100,
  timeLeft: TIME_LIMIT,
  combo: 0,
};

export default function Home() {
  const [phase, setPhase] = useState<Phase>("start");
  const [hud, setHud] = useState<HudState>(INITIAL_HUD);
  const [result, setResult] = useState<GameResult | null>(null);
  // 結果のAI一言。null の間はローカル定型文を表示（LLM 生成が来たら差し替え / spec §10）。
  const [aiResult, setAiResult] = useState<string | null>(null);
  const { videoRef, status, start, stop } = useCamera();
  // 怒れるAIのBGM（Codex提供音源）。スタート操作で解錠、動画後のplayingでループ。
  const { unlock: unlockBgm, play: playBgm, stop: stopBgm } = useBgm(
    "/audio/rage-of-the-void.mp3",
  );

  // カメラ拒否時は keyboard へフォールバック（spec §5, §12-5）。
  const inputMode: InputMode = status === "denied" ? "keyboard" : "camera";

  // playerX(0..1) を毎フレーム更新（playing のときだけ稼働）。
  const playerXRef = usePlayerX(phase === "playing", inputMode, videoRef);

  // intro（動画再生中）にカメラを裏で要求し、playing までに準備しておく。start/result で停止。
  useEffect(() => {
    if (phase === "intro") start();
    if (phase === "start" || phase === "result") stop();
  }, [phase, start, stop]);

  // 結果が出たら AI の一言を LLM 生成（終了動画の再生中に先に取りに行き、結果画面で間に合わせる）。
  useEffect(() => {
    if ((phase !== "ending" && phase !== "result") || !result) return;
    let alive = true;
    fetchResultComment(result).then((t) => {
      if (alive) setAiResult(t);
    });
    return () => {
      alive = false;
    };
  }, [phase, result]);

  // 動画終了 / スキップ → BGM開始してプレイへ。
  const goPlaying = () => {
    playBgm();
    setPhase("playing");
  };

  // カメラ映像（ミラー）は intro から playing まで常駐（playing 開始時に確実にストリームを持つ）。
  const showVideo = phase === "intro" || phase === "playing";

  return (
    <div className="relative flex flex-1 flex-col items-center justify-center gap-6 overflow-hidden bg-black p-8 text-center text-zinc-100">
      {/* カメラ映像レイヤー（ミラー）。intro 中は動画の裏、playing 中は薄く背景（spec §6） */}
      {showVideo && (
        <video
          ref={videoRef}
          playsInline
          muted
          className={`pointer-events-none absolute inset-0 h-full w-full -scale-x-100 object-cover ${
            phase === "playing" ? "opacity-20" : "opacity-0"
          }`}
        />
      )}

      {/* start: start.png を全面背景にしてスタートボタン */}
      {phase === "start" && (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/start.png"
            alt="YAWARAi"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="relative z-10 mt-auto mb-16">
            <button
              className="rounded-full bg-rose-600 px-10 py-4 text-lg font-bold shadow-lg hover:bg-rose-500"
              onClick={() => {
                unlockBgm(); // ユーザー操作中に音声を解錠（spec §12-3）
                setPhase("intro");
              }}
            >
              スタート
            </button>
          </div>
        </>
      )}

      {/* intro: start_1.mp4 を全画面再生。終了 or スキップで playing へ */}
      {phase === "intro" && (
        <>
          <video
            src="/start_1.mp4"
            autoPlay
            playsInline
            onEnded={goPlaying}
            className="absolute inset-0 z-20 h-full w-full bg-black object-contain"
          />
          <button
            className="absolute bottom-6 right-6 z-30 rounded-full bg-black/60 px-5 py-2 text-sm font-semibold backdrop-blur hover:bg-black/80"
            onClick={goPlaying}
          >
            スキップ ▶
          </button>
        </>
      )}

      {phase === "playing" && (
        <>
          <GameCanvas
            playerXRef={playerXRef}
            onHud={setHud}
            onEnd={(r) => {
              stopBgm(); // 終了でBGM停止
              setAiResult(null); // 前回のコメントを消す
              setResult(r);
              setPhase("ending"); // 結果に応じた終了動画へ
            }}
          />
          {/* 暫定HUD（spec §6 / 見た目は Codex 差し替え前提） */}
          <div className="absolute left-0 right-0 top-0 z-10 flex items-center justify-between gap-4 p-4 text-sm">
            <div className="font-mono">SCORE {hud.score}</div>
            <div className="flex-1">
              <div className="mx-auto h-3 max-w-xs overflow-hidden rounded-full bg-zinc-700">
                <div
                  className="h-full bg-rose-500 transition-all"
                  style={{ width: `${hud.anger}%` }}
                />
              </div>
              <div className="mt-1 text-xs text-zinc-400">怒り {hud.anger}</div>
            </div>
            <div className="font-mono">
              {hud.timeLeft}s{hud.combo >= 2 ? ` / ${hud.combo}combo` : ""}
            </div>
          </div>
          {/* AIの節目セリフ（怒り段階に連動・段階内では固定でぶれない） */}
          <div className="absolute left-0 right-0 top-16 z-10 text-center text-sm text-zinc-200">
            「{MOOD_LINES[aiMoodFromAnger(hud.anger)][0]}」
          </div>
        </>
      )}

      {/* ending: 怒り0で沈静=end1.mp4 / 時間切れ=end2.mp4。終了 or スキップで結果へ */}
      {phase === "ending" && result && (
        <>
          <video
            src={result.cleared ? "/end1.mp4" : "/end2.mp4"}
            autoPlay
            playsInline
            onEnded={() => setPhase("result")}
            className="absolute inset-0 z-20 h-full w-full bg-black object-contain"
          />
          <button
            className="absolute bottom-6 right-6 z-30 rounded-full bg-black/60 px-5 py-2 text-sm font-semibold backdrop-blur hover:bg-black/80"
            onClick={() => setPhase("result")}
          >
            スキップ ▶
          </button>
        </>
      )}

      {phase === "result" && result && (
        <div className="relative z-10 flex flex-col items-center gap-4">
          <h2 className="text-3xl font-bold">
            {result.cleared ? "AIは穏やかになった" : "時間切れ"}
          </h2>
          <div className="text-5xl">{result.cleared ? "😌" : "😠"}</div>
          <p className="text-lg">スコア {result.score}</p>
          <p className="text-lg">しなやか度 {result.shinayaka}%</p>
          <p className="text-sm text-zinc-400">
            回収 {result.soft} / 被弾 {result.hard}
          </p>
          {/* AIからの一言（LLM生成。来るまではローカル定型文・失敗時もこれ / spec §10） */}
          <p className="max-w-sm text-base text-zinc-200">
            「{aiResult ?? resultComment(result.cleared, result.shinayaka)}」
          </p>
          <p className="text-xs text-zinc-500">AIにもやさしくしよう。</p>
          <button
            className="rounded-full bg-rose-600 px-8 py-3 font-semibold hover:bg-rose-500"
            onClick={() => {
              stopBgm();
              setPhase("start");
            }}
          >
            もう一度
          </button>
        </div>
      )}
    </div>
  );
}

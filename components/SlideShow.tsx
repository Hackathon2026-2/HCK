"use client";

// 終了後の説明スライド（spec の説明＝Codex領域の素材を反映。docxの指示通り
// 背景画像<img>の上に「文字だけの透過SVG」を重ねる＝SVG内画像のブロック回避）。
// ending（動画）の後に表示し、最後に onDone() で結果画面へ。
import { useState } from "react";

interface Slide {
  bg: string[]; // 背景画像（split時は左右2枚）
  svg: string; // 透過テキストSVG
  split?: boolean; // 左右分割背景か
}

// 使用説明（導入動画の後・プレイ前に表示）。
export const TUTORIAL_SLIDES: Slide[] = [
  { bg: ["/slides/bg1.png"], svg: "/slides/slide1.svg" },
  { bg: ["/slides/bg2.png"], svg: "/slides/slide2.svg" },
  // slide3 は happy(左)/angry(右) を分割表示
  { bg: ["/slides/bg3.png", "/slides/bg4.png"], svg: "/slides/slide3.svg", split: true },
];

// 終了スライド（終了動画の後に表示）: 技術スタック＆こだわり / 質疑応答 Q&A。
export const ENDING_SLIDES: Slide[] = [
  { bg: ["/slides/ebg1.png"], svg: "/slides/eslide1.svg" },
  { bg: ["/slides/ebg2.png"], svg: "/slides/eslide2.svg" },
];

export function SlideShow({
  slides,
  doneLabel = "結果へ ▶",
  onDone,
}: {
  slides: Slide[];
  doneLabel?: string;
  onDone: () => void;
}) {
  const [i, setI] = useState(0);
  const slide = slides[i];
  const last = i === slides.length - 1;

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-slate-900">
      {/* 16:9 のスライド面（画面内に収める） */}
      <div className="relative aspect-video max-h-full w-full max-w-full">
        {slide.split ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.bg[0]}
              alt=""
              className="absolute inset-y-0 left-0 h-full w-1/2 object-cover opacity-50"
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={slide.bg[1]}
              alt=""
              className="absolute inset-y-0 right-0 h-full w-1/2 object-cover opacity-50"
            />
          </>
        ) : (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={slide.bg[0]}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-40"
          />
        )}
        {/* 文字だけの透過SVGを上に重ねる */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={slide.svg} alt="" className="absolute inset-0 z-10 h-full w-full" />
      </div>

      {/* ページ表示 */}
      <div className="absolute bottom-6 left-1/2 z-30 flex -translate-x-1/2 gap-2">
        {slides.map((_, idx) => (
          <span
            key={idx}
            className={`h-2 w-2 rounded-full ${idx === i ? "bg-white" : "bg-white/30"}`}
          />
        ))}
      </div>

      {/* ナビゲーション */}
      <div className="absolute bottom-6 right-6 z-30 flex gap-3">
        {i > 0 && (
          <button
            className="rounded-full bg-black/60 px-5 py-2 text-sm font-semibold backdrop-blur hover:bg-black/80"
            onClick={() => setI(i - 1)}
          >
            ◀ 戻る
          </button>
        )}
        <button
          className="rounded-full bg-rose-600 px-6 py-2 text-sm font-bold hover:bg-rose-500"
          onClick={() => (last ? onDone() : setI(i + 1))}
        >
          {last ? doneLabel : "次へ ▶"}
        </button>
      </div>
    </div>
  );
}

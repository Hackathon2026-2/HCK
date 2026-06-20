// YAWARAi エントリ（S0: デプロイ確認用の最小ランディング）
// 本番のフェーズ管理（start→intro→camera→playing→result）は S1 でここに実装する。
export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 bg-black p-8 text-center text-zinc-100">
      <h1 className="text-5xl font-bold tracking-tight">YAWARAi</h1>
      <p className="max-w-md text-zinc-400">
        怒ったAIが投げる「硬い言葉」を体で避け、「優しい言葉」を集めて鎮める Webカメラ体験ゲーム。
      </p>
      <p className="text-sm text-zinc-600">セットアップ完了。ゲーム実装はこれから。</p>
    </div>
  );
}

export default function RootLoading() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/icon-192x192.png" alt="Re" className="h-10 w-10 object-contain" />
            <span className="text-2xl font-bold text-white font-playfair">- Start</span>
          </div>
        <div className="h-1 w-16 rounded-full bg-white/20 overflow-hidden">
          <div className="h-full w-1/2 animate-pulse bg-primary rounded-full" />
        </div>
      </div>
    </main>
  );
}

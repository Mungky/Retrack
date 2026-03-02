import Link from "next/link";
import { FileQuestion } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="flex justify-center">
          <div className="rounded-full bg-muted p-4">
            <FileQuestion className="size-12 text-muted-foreground" strokeWidth={1.5} />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold font-playfair text-foreground">
            Halaman Tidak Ditemukan
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            URL yang Anda cari tidak ada atau telah dipindahkan.
          </p>
        </div>
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 h-10 px-4 py-2 rounded-xl font-semibold bg-primary text-primary-foreground hover:bg-primary/90 active:bg-primary/80 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}

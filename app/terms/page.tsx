import Link from "next/link";

export const metadata = {
  title: "Syarat & Ketentuan | Re-Start",
  description: "Syarat dan ketentuan penggunaan aplikasi Re-Start.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen px-4 py-16 md:py-24 relative z-10">
      <div className="max-w-3xl mx-auto">
        <Link
          href="/"
          className="text-sm text-muted-foreground hover:text-foreground mb-8 inline-block"
        >
          ← Kembali
        </Link>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground font-[var(--font-playfair)] mb-8">
          Syarat & Ketentuan
        </h1>
        <div className="prose prose-invert max-w-none text-muted-foreground space-y-6">
          <p className="text-sm leading-relaxed">
            Halaman ini berisi syarat dan ketentuan penggunaan aplikasi Re-Start.
            Dokumen lengkap akan ditambahkan sesuai kebutuhan operasional dan
            persyaratan Payment Gateway (Midtrans).
          </p>
          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-2">
              1. Penggunaan Layanan
            </h2>
            <p className="text-sm leading-relaxed">
              Dengan mendaftar dan menggunakan Re-Start, Anda setuju untuk mematuhi
              syarat dan ketentuan yang berlaku. Aplikasi ini menyediakan layanan
              pelacakan keuangan pribadi.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-2">
              2. Pembayaran & Plan Pro
            </h2>
            <p className="text-sm leading-relaxed">
              Plan Pro (Rp 50.000) merupakan pembayaran satu kali untuk akses
              selamanya. Pembayaran diproses melalui Midtrans. Kebijakan refund
              akan dijelaskan secara terpisah.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-2">
              3. Kontak
            </h2>
            <p className="text-sm leading-relaxed">
              Untuk pertanyaan mengenai syarat dan ketentuan, silakan hubungi kami
              melalui saluran yang tersedia di aplikasi.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

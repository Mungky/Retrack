import Link from "next/link";

export const metadata = {
  title: "Kebijakan Privasi | Re-Start",
  description: "Kebijakan privasi dan perlindungan data pengguna Re-Start.",
};

export default function PrivacyPage() {
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
          Kebijakan Privasi
        </h1>
        <div className="prose prose-invert max-w-none text-muted-foreground space-y-6">
          <p className="text-sm leading-relaxed">
            Re-Start menghormati privasi pengguna. Dokumen kebijakan privasi ini
            menjelaskan bagaimana kami mengumpulkan, menyimpan, dan melindungi
            data Anda. Dokumen lengkap akan diperbarui sesuai kebutuhan dan
            persyaratan Payment Gateway (Midtrans).
          </p>
          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-2">
              1. Data yang Kami Kumpulkan
            </h2>
            <p className="text-sm leading-relaxed">
              Kami menyimpan data yang diperlukan untuk operasional aplikasi:
              email, data transaksi keuangan, dan preferensi pengguna. Data
              disimpan di infrastruktur aman (Supabase).
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-2">
              2. Penggunaan Data
            </h2>
            <p className="text-sm leading-relaxed">
              Data digunakan semata-mata untuk menyediakan layanan pelacakan
              keuangan. Kami tidak menjual atau membagikan data pribadi Anda
              kepada pihak ketiga untuk keperluan pemasaran.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-2">
              3. Keamanan
            </h2>
            <p className="text-sm leading-relaxed">
              Kami menerapkan praktik keamanan yang wajar untuk melindungi data
              pengguna. Pembayaran diproses melalui Midtrans yang mematuhi
              standar keamanan industri.
            </p>
          </section>
          <section>
            <h2 className="text-lg font-semibold text-foreground mt-8 mb-2">
              4. Hubungi Kami
            </h2>
            <p className="text-sm leading-relaxed">
              Untuk pertanyaan mengenai kebijakan privasi, silakan hubungi kami
              melalui saluran yang tersedia.
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}

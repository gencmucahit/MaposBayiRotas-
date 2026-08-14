/**
 * Next.js'in loading.tsx kuralı ile kullanılan paylaşılan yükleniyor
 * ekranı: bir sayfa geçişi sunucudan veri beklerken (bkz. isletmeler/,
 * rota/, (dashboard)/loading.tsx) tıklama ile sayfa görünene kadar geçen
 * sürede kullanıcıya anında görsel geri bildirim verir. Bunsuz, yavaş bir
 * sunucu yanıtında uygulama "donmuş" gibi hissettiriyordu.
 */
export function LoadingScreen() {
  return (
    <div className="flex h-[calc(100vh-56px)] items-center justify-center">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <span className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-emerald-600" />
        <p className="text-sm">Yükleniyor…</p>
      </div>
    </div>
  );
}

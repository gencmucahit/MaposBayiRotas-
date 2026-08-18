/**
 * Push bildirimlerinde Android'in durum çubuğunda gösterdiği küçük "badge"
 * ikonu için: Android bu ikonu renklerini yok sayıp sadece şeffaflık
 * (alpha) kanalından bir siluet olarak çizer. AppIconMark gibi dolu renkli
 * bir kare kullanılırsa tamamen beyaz bir kare olarak görünür — bu yüzden
 * arka planı tamamen şeffaf, sadece harfi opak bırakıyoruz.
 */
export function AppBadgeMark({ size }: { size: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <span
        style={{
          fontSize: Math.round(size * 0.78),
          fontWeight: 700,
          color: "#ffffff",
          fontFamily: "Arial, Helvetica, sans-serif",
          lineHeight: 1,
        }}
      >
        M
      </span>
    </div>
  );
}

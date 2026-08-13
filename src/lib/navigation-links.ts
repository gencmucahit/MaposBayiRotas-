/**
 * Google Haritalar'da bu koordinata yol tarifi başlatan evrensel link.
 * Mobilde Google Maps uygulaması yüklüyse doğrudan onu açar, değilse
 * tarayıcıda web sürümünü gösterir.
 */
export function googleMapsDirectionsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
}

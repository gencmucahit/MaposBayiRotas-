/**
 * Google Haritalar'da bu koordinata yol tarifi başlatan evrensel link.
 * Mobilde Google Maps uygulaması yüklüyse doğrudan onu açar, değilse
 * tarayıcıda web sürümünü gösterir.
 */
export function googleMapsDirectionsUrl(latitude: number, longitude: number) {
  return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}&travelmode=driving`;
}

/**
 * Yandex Navi (Yandex Navigasyon) uygulamasını bu koordinata rota
 * oluşturacak şekilde açan derin link. Uygulama telefonda yüklü değilse
 * hiçbir şey olmaz (tarayıcı sessizce yok sayar).
 */
export function yandexNaviUrl(latitude: number, longitude: number) {
  return `yandexnavi://build_route_on_map?lat_to=${latitude}&lon_to=${longitude}`;
}

# Mapos Bayi Rotası

Restoranlara adisyon sistemi kuran bir yazılım firması için geliştirilmiş iç kullanım
aracı. Kurulan işletmeleri bir harita üzerinde görüntüler, işletme/müşteri bilgilerini
ve ziyaret notlarını yönetir, saha ekibi için çoklu durak içeren ziyaret rotaları
oluşturur.

## Özellikler

- **Harita ekranı** — tüm işletmeler durum rengine göre (aktif/potansiyel/pasif)
  kodlanmış pinlerle gösterilir. Arama, duruma göre filtreleme, popup üzerinden hızlı
  detay erişimi.
- **İşletme yönetimi** — ekleme/düzenleme/silme, haritaya tıklayarak veya elle
  koordinat girme, adisyon sistemi detayları (kurulum tarihi, paket, lisans durumu),
  yetkili kişi bilgisi.
- **Ziyaret notları** — her işletme için zaman damgalı not geçmişi.
- **Rota oluşturma** — haritadan veya listeden sırasıyla işletme seçerek ziyaret
  rotası oluşturma, tahmini mesafe hesaplama, rotayı kaydetme ve tekrar görüntüleme.
- **Kimlik doğrulama** — e-posta/şifre ile giriş, tüm ekranlar oturum gerektirir.
- **Responsive tasarım** — masaüstü ve mobil tarayıcıda kullanılabilir (PWA yaklaşımı).
- **Harita pinleri üzerine gelince isim gösterme** — fareyle bir pinin üzerine
  gelindiğinde işletme adı tooltip olarak belirir; rota ekranında seçilen duraklar
  sıra numarasıyla birlikte kalıcı olarak etiketlenir.
- **Dış sistemler için REST API** — API anahtarıyla korunan `/api/businesses`
  endpoint'i üzerinden programatik işletme kaydı (bkz. "API" bölümü).
- **Konumunuzu gösterme** — harita ve rota ekranlarında "buradasınız" işareti ve
  konuma git butonu; işletme ekleme/düzenleme formunda tek dokunuşla "şu anki
  konumumu kullan" butonu ile enlem/boylamı otomatik doldurma.
- **Google Haritalar linkinden içe aktarma** — işletme formuna bir Google
  Haritalar linki yapıştırarak işletme adını, adresini ve koordinatlarını
  otomatik doldurma.
- **Mobil öncelikli düzen** — saha ekibinin telefondan rahat kullanabilmesi için
  harita/liste ekranları ve işletme listesi mobilde optimize edilmiştir.

## Teknoloji

- **Next.js 16** (App Router, Turbopack, Server Actions) + TypeScript
- **Tailwind CSS 4**
- **PostgreSQL** + **Prisma ORM**
- **NextAuth (Auth.js) v5** — Credentials provider, JWT session
- **Leaflet + OpenStreetMap** (ücretsiz, açık kaynak harita)
- **zod** — form/veri doğrulama

## Gereksinimler

- Node.js 20.9+ (geliştirme Node 23 ile yapıldı)
- Bir PostgreSQL sunucusu (bkz. aşağıdaki "Veritabanı" bölümü)

## Kurulum

```bash
npm install
```

`.env` dosyası zaten `DATABASE_URL`, `AUTH_SECRET` ve `NEXTAUTH_URL` ile hazır
geliyor. Farklı bir veritabanına bağlanacaksanız `DATABASE_URL`'i güncelleyin ve
üretimde `AUTH_SECRET`'i mutlaka değiştirin (`openssl rand -base64 32`).

### Veritabanı

Bu proje geliştirilirken bu makinede sistem geneli bir PostgreSQL kurulumu yoktu, bu
yüzden proje köküne (`../.postgres-runtime`) taşınabilir bir Postgres.app kopyası
indirilip yerel bir veritabanı sunucusu ayağa kaldırıldı. Bu sunucuyu yönetmek için:

```bash
npm run db:start   # sunucuyu başlat (127.0.0.1:5432)
npm run db:status  # durumunu kontrol et
npm run db:stop    # sunucuyu durdur
```

Kendi makinenizde zaten bir PostgreSQL sunucunuz varsa bu scriptlere ihtiyacınız
yok — sadece `.env` içindeki `DATABASE_URL`'i kendi bağlantı bilgilerinizle
değiştirin.

Şema ve migration'ları uygulamak için:

```bash
npx prisma migrate dev
```

Örnek verilerle doldurmak için:

```bash
npm run db:seed
```

### Geliştirme sunucusunu başlatma

```bash
npm run db:start   # veritabanı çalışmıyorsa
npm run dev
```

Uygulama http://localhost:3000 adresinde açılır.

### Demo giriş bilgileri

Seed script'i aşağıdaki hesabı oluşturur:

- **E-posta:** `mucahit@gencmucahit.com`
- **Şifre:** `customermap123`

Yeni kullanıcı eklemek için Prisma Studio (`npx prisma studio`) kullanabilir veya
`prisma/seed.ts` dosyasına yeni bir kullanıcı ekleyebilirsiniz. Şu an uygulamada
kayıt (sign-up) ekranı yok — kullanıcılar veritabanına elle/seed ile eklenir
(iç kullanım aracı olduğu için kasıtlı bir tercih).

## API

Dış sistemlerin (ör. adisyon kurulum aracınız) uygulamaya işletme kaydı yapabilmesi
için basit, API anahtarıyla korunan bir REST endpoint'i mevcuttur. Anahtar `.env`
içindeki `API_KEY` değişkeninde tutulur; üretimde mutlaka değiştirin.

Kimlik doğrulama, isteğe şu header'lardan biriyle eklenir:

```
x-api-key: <ANAHTAR>
```

veya

```
Authorization: Bearer <ANAHTAR>
```

### `POST /api/businesses` — yeni işletme kaydı oluştur

```bash
curl -X POST http://localhost:3000/api/businesses \
  -H "Content-Type: application/json" \
  -H "x-api-key: $API_KEY" \
  -d '{
    "name": "Lezzet Durağı Kadıköy",
    "address": "Caferağa Mah. Moda Cad. No:12, Kadıköy/İstanbul",
    "phone": "0216 345 12 34",
    "latitude": 40.9877,
    "longitude": 29.0272,
    "status": "ACTIVE",
    "contactName": "Ahmet Yılmaz",
    "installDate": "2025-03-10",
    "planType": "Standart",
    "licenseStatus": "Aktif"
  }'
```

Zorunlu alanlar: `name`, `latitude`, `longitude`. Diğer tüm alanlar opsiyoneldir;
`status` belirtilmezse `POTENTIAL` (potansiyel müşteri) varsayılır. Başarılı
kayıtta `201` ve oluşturulan işletme JSON olarak döner; doğrulama hatasında `400`
ve alan bazlı hata mesajları, geçersiz/eksik API anahtarında `401` döner.

Kaydedilen işletme haritada ve işletme listesinde anında görünür (sayfa
yenilendiğinde).

### `GET /api/businesses` — kayıtlı işletmeleri listele

```bash
curl http://localhost:3000/api/businesses -H "x-api-key: $API_KEY"
```

Doğrulama/entegrasyon testleri için kullanılabilir.

## Production build

```bash
npm run build
npm run start
```

## Proje yapısı

```
src/
  app/
    login/                  → giriş sayfası
    (dashboard)/            → oturum gerektiren tüm ekranlar
      page.tsx              → harita ana sayfa
      isletmeler/            → işletme listesi, ekleme, detay, düzenleme
      rota/                  → rota oluşturma ve rota detay sayfaları
    api/auth/[...nextauth]/  → NextAuth route handler
  actions/                  → Server Actions (business, note, route, auth)
  components/               → paylaşılan UI bileşenleri (form, harita, nav…)
  components/map/           → Leaflet harita bileşenleri (client-only, dynamic import)
  lib/                      → Prisma client, auth config, validation, yardımcılar
  generated/prisma/         → Prisma'nın ürettiği client (elle düzenlemeyin)
prisma/
  schema.prisma             → veri modeli
  seed.ts                   → örnek veri
```

## Bilinen sınırlamalar / sonraki adımlar

- Rota mesafesi kuş uçuşu (haversine) hesaplanıyor; gerçek yol mesafesi için bir
  yönlendirme servisi (ör. OSRM) entegre edilebilir.
- Tüm kullanıcılar aynı yetkiye sahip; admin/saha ekibi gibi roller için veri
  modelinde `User` tablosu hazır ama yetkilendirme mantığı henüz eklenmedi.
- Adres girildiğinde otomatik koordinat önerisi (geocoding) yok; koordinatlar elle
  veya haritaya tıklayarak giriliyor.

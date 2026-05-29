# Discord Bot Boilerplate

TypeScript, Node.js ve discord.js v14 ile hazırlanmış, genişletilebilir bir Discord bot altyapısıdır.

## Özellikler

- Slash command tabanlı mimari
- Klasör bazlı komut ve event yükleyici
- Özel Discord client sınıfı
- Global ve test sunucusu için deploy scripti
- Type-safe yapı ve strict TypeScript ayarları
- Dinamik ürün deposu ve ticket/feedback akışları
- MongoDB destekli ürün deposu

## Kurulum

```bash
npm install
```

`.env.example` dosyasını kopyalayıp `.env` oluşturun ve değerleri doldurun.

MongoDB kullanımı için ayrıca şu değişkenleri ekleyin:

- `MONGODB_URI`
- `MONGODB_DB_NAME`

`MONGODB_DB_NAME` verilmezse varsayılan olarak `eonbypass` kullanılır.

## Geliştirme

```bash
npm run dev
```

## Derleme

```bash
npm run build
```

## Çalıştırma

```bash
npm start
```

## Komut Deploy

```bash
npm run deploy
```

Deploy scripti `DISCORD_CLIENT_ID` ve `DISCORD_TOKEN` zorunlu olacak şekilde çalışır. `DISCORD_GUILD_ID` tanımlıysa test sunucusuna da yükleme yapar. `DEPLOY_GLOBAL_COMMANDS` ve `DEPLOY_GUILD_COMMANDS` ile davranışı kontrol edebilirsiniz.

## Yeni Sistemler

- `feedback-kur`: Kanala feedback paneli gönderir.
- `ticket-kur`: Kanala ticket paneli gönderir.
- `urun-ekle`: Sisteme dinamik ürün ekler.
- `urun-sil`: Sistemdeki ürünleri seçerek siler.

Discord uygulama komut adları ASCII kısıtlarına bağlı olduğundan ürün komutları `urun-ekle` ve `urun-sil` olarak kayıt edilir.

Gerekli ek ortam değişkenleri:

- `MANAGEMENT_ROLE_ID`
- `FEEDBACK_LOG_CHANNEL_ID`
- `TICKET_LOG_CHANNEL_ID`
- `TICKET_CATEGORY_ID`
- `MONGODB_URI`
- `MONGODB_DB_NAME` (opsiyonel)

## Klasör Yapısı

```text
src/
  client/
  commands/
  config/
  events/
  types/
  utils/
  deploy-commands.ts
  index.ts
```

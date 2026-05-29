import express from 'express'; // En üste import et

const app = express();
const PORT = process.env.PORT || 10000; // Render portu otomatik verir, yoksa 10000 kullanır

// Render buraya vurunca 200 OK kodu alacak ve "Port açık" diyecek
app.get('/', (req, res) => {
    res.send('Bot aktif ve port dinleniyor!');
});

app.listen(PORT, () => {
    console.log(`Render için web sunucusu ${PORT} portunda başarıyla başlatıldı.`);
});

// Botunun kendi login kodları bundan sonra gelmeli:
// client.login(process.env.DISCORD_TOKEN);

import "dotenv/config";

import { env } from "./config/env.js";
import { BotClient } from "./client/BotClient.js";

async function main(): Promise<void> {
  const client = new BotClient();

  await client.initialize();
  await client.login(env.token);
}

process.on("unhandledRejection", (error) => {
  console.error("Beklenmeyen promise reddi:", error);
});

process.on("uncaughtException", (error) => {
  console.error("Beklenmeyen uygulama hatası:", error);
});

main().catch((error) => {
  console.error("Bot başlatılamadı.", error);
  process.exitCode = 1;
});

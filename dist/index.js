import "dotenv/config";
import { env } from "./config/env.js";
import { BotClient } from "./client/BotClient.js";
async function main() {
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

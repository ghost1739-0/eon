import type { Client } from "discord.js";

import type { BotEvent } from "../../types/BotEvent.js";

const readyEvent: BotEvent<"ready"> = {
  name: "ready",
  once: true,

  async execute(client: Client<true>) {
    const tag = client.user.tag;
    const commandCount = client.commands.size;

    console.info(`Giriş yapıldı: ${tag}`);
    console.info(`Hazır: ${commandCount} slash command aktif.`);
  },
};

export default readyEvent;

import { SlashCommandBuilder } from "discord.js";

import type { SlashCommand } from "../../types/SlashCommand.js";

const pingCommand: SlashCommand = {
  data: new SlashCommandBuilder().setName("ping").setDescription("Botun anlık gecikmesini gösterir."),

  async execute(interaction) {
    const latency = Math.round(interaction.client.ws.ping);

    await interaction.reply({
      content: `Pong! WS gecikmesi: ${latency}ms`,
    });
  },
};

export default pingCommand;

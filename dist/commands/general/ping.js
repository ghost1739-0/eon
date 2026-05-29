import { SlashCommandBuilder } from "discord.js";
const pingCommand = {
    data: new SlashCommandBuilder().setName("ping").setDescription("Botun anlık gecikmesini gösterir."),
    async execute(interaction) {
        const latency = Math.round(interaction.client.ws.ping);
        await interaction.reply({
            content: `Pong! WS gecikmesi: ${latency}ms`,
        });
    },
};
export default pingCommand;

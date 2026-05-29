import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { buildTicketSetupPayload } from "../../services/ticketService.js";
const ticketSetupCommand = {
    data: new SlashCommandBuilder()
        .setName("ticket-kur")
        .setDescription("Bulunduğun kanala ticket paneli kurar.")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDMPermission(false),
    async execute(interaction) {
        if (!interaction.inCachedGuild() || !interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
            await interaction.reply({ content: "Bu komutu kullanmak için yönetici yetkisine sahip olmalısın.", ephemeral: true });
            return;
        }
        if (!interaction.channel?.isTextBased()) {
            await interaction.reply({ content: "Bu komut yalnızca mesaj gönderilebilen bir kanalda kullanılabilir.", ephemeral: true });
            return;
        }
        await interaction.channel.send(buildTicketSetupPayload());
        await interaction.reply({ content: "Ticket paneli kanala gönderildi.", ephemeral: true });
    },
};
export default ticketSetupCommand;

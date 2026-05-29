import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { buildFeedbackSetupPayload } from "../../services/ticketService.js";
const feedbackSetupCommand = {
    data: new SlashCommandBuilder()
        .setName("feedback-kur")
        .setDescription("Bulunduğun kanala geri bildirim paneli kurar.")
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
        await interaction.channel.send(buildFeedbackSetupPayload());
        await interaction.reply({ content: "Feedback paneli kanala gönderildi.", ephemeral: true });
    },
};
export default feedbackSetupCommand;

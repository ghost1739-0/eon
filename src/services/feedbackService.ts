import { EmbedBuilder, Colors, type ModalSubmitInteraction } from "discord.js";

import { env } from "../config/env.js";

export async function sendFeedbackLog(interaction: ModalSubmitInteraction, licenseKey: string, feedbackText: string): Promise<void> {
  if (!interaction.inCachedGuild()) {
    throw new Error("Bu işlem yalnızca önbelleğe alınmış sunucularda kullanılabilir.");
  }

  if (!env.feedbackLogChannelId) {
    throw new Error("FEEDBACK_LOG_CHANNEL_ID tanımlı değil.");
  }

  const logChannel = interaction.guild.channels.cache.get(env.feedbackLogChannelId);

  if (!logChannel || !logChannel.isTextBased()) {
    throw new Error("Geçerli bir feedback log kanalı bulunamadı.");
  }

  const embed = new EmbedBuilder()
    .setColor(Colors.Blurple)
    .setTitle("New Feedback / Yeni Geri Bildirim")
    .addFields(
      { name: "User", value: `${interaction.user} (${interaction.user.tag})`, inline: false },
      { name: "License Key / Lisans Anahtarı", value: licenseKey, inline: false },
      { name: "Feedback / Geri Bildirim", value: feedbackText.slice(0, 1024), inline: false },
    )
    .setTimestamp();

  await logChannel.send({ embeds: [embed] });
}

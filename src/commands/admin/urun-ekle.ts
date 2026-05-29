import { PermissionsBitField, SlashCommandBuilder } from "discord.js";

import type { SlashCommand } from "../../types/SlashCommand.js";
import { productStore } from "../../storage/productStore.js";

const productAddCommand: SlashCommand = {
  data: new SlashCommandBuilder()
    .setName("urun-ekle")
    .setDescription("Sisteme yeni bir ürün ekler.")
    .addStringOption((option) => option.setName("isim").setDescription("Ürün adı").setRequired(true))
    .addStringOption((option) => option.setName("fiyat").setDescription("Fiyat bilgisi, örn: 60$ / 2500₺").setRequired(true))
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .setDMPermission(false),

  async execute(interaction) {
    if (!interaction.inCachedGuild() || !interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
      await interaction.reply({ content: "Bu komutu kullanmak için yönetici yetkisine sahip olmalısın.", ephemeral: true });
      return;
    }

    const name = interaction.options.getString("isim", true);
    const price = interaction.options.getString("fiyat", true);

    try {
      const product = await productStore.add(name, price);
      interaction.client.products.set(product.id, product);

      await interaction.reply({
        content: `Ürün eklendi: **${product.name}** - **${product.price}**`,
        ephemeral: true,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ürün eklenirken beklenmeyen bir hata oluştu.";

      await interaction.reply({ content: message, ephemeral: true });
    }
  },
};

export default productAddCommand;

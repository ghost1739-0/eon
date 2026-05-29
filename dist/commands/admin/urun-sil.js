import { PermissionsBitField, SlashCommandBuilder } from "discord.js";
import { productStore } from "../../storage/productStore.js";
import { buildProductDeleteMenu, buildProductDeleteNotice } from "../../services/ticketService.js";
const productDeleteCommand = {
    data: new SlashCommandBuilder()
        .setName("urun-sil")
        .setDescription("Sistemdeki ürünleri listeler ve seçileni siler.")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
        .setDMPermission(false),
    async execute(interaction) {
        if (!interaction.inCachedGuild() || !interaction.memberPermissions?.has(PermissionsBitField.Flags.Administrator)) {
            await interaction.reply({ content: "Bu komutu kullanmak için yönetici yetkisine sahip olmalısın.", ephemeral: true });
            return;
        }
        const products = productStore.list();
        if (products.length === 0) {
            await interaction.reply({ content: "Sistemde silinecek ürün bulunmuyor.", ephemeral: true });
            return;
        }
        await interaction.reply({
            embeds: [buildProductDeleteNotice(products.length)],
            components: [buildProductDeleteMenu(products)],
            ephemeral: true,
        });
    },
};
export default productDeleteCommand;

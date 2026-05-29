import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  Interaction,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";

import { CustomIds } from "../../constants/customIds.js";
import { productStore } from "../../storage/productStore.js";
import type { BotEvent } from "../../types/BotEvent.js";
import {
  buildPurchaseSelectionPayload,
  createLicenseTicket,
  createPurchaseTicket,
  handleTicketClose,
} from "../../services/ticketService.js";
import { sendFeedbackLog } from "../../services/feedbackService.js";

const interactionCreateEvent: BotEvent<"interactionCreate"> = {
  name: "interactionCreate",

  async execute(interaction: Interaction) {
    try {
      if (interaction.isChatInputCommand()) {
        const command = interaction.client.commands.get(interaction.commandName);

        if (!command) {
          await interaction.reply({
            content: `Komut bulunamadı: ${interaction.commandName}`,
            ephemeral: true,
          });

          return;
        }

        await command.execute(interaction);
        return;
      }

      if (interaction.isButton()) {
        if (interaction.customId === CustomIds.feedbackOpenModalButton) {
          const modal = new ModalBuilder()
            .setCustomId(CustomIds.feedbackSubmitModal)
            .setTitle("Submit Feedback / Geri Bildirim");

          const licenseInput = new TextInputBuilder()
            .setCustomId("feedback-license-key")
            .setLabel("License Key / Lisans Anahtarı")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const feedbackInput = new TextInputBuilder()
            .setCustomId("feedback-message")
            .setLabel("Your Feedback / Geri Bildiriminiz")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

          modal.addComponents(
            new ActionRowBuilder<TextInputBuilder>().addComponents(licenseInput),
            new ActionRowBuilder<TextInputBuilder>().addComponents(feedbackInput),
          );

          await interaction.showModal(modal);
          return;
        }

        if (interaction.customId === CustomIds.ticketPurchaseButton) {
          const products = interaction.client.products;

          if (products.size === 0) {
            await interaction.reply({ content: "Şu anda listelenen bir ürün bulunmamaktadır.", ephemeral: true });
            return;
          }

          await interaction.reply({ ...buildPurchaseSelectionPayload(products.toJSON()), ephemeral: true });

          return;
        }

        if (interaction.customId === CustomIds.ticketSupportButton) {
          const modal = new ModalBuilder()
            .setCustomId(CustomIds.ticketLicenseSupportModal)
            .setTitle("License Verification / Lisans Doğrulama");

          const licenseInput = new TextInputBuilder()
            .setCustomId("ticket-license-key")
            .setLabel("License Key / Lisans Anahtarı")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(licenseInput));

          await interaction.showModal(modal);
          return;
        }

        if (interaction.customId === CustomIds.ticketInquiryButton) {
          const modal = new ModalBuilder()
            .setCustomId(CustomIds.ticketLicenseInquiryModal)
            .setTitle("License Verification / Lisans Doğrulama");

          const licenseInput = new TextInputBuilder()
            .setCustomId("ticket-license-key")
            .setLabel("License Key / Lisans Anahtarı")
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          modal.addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(licenseInput));

          await interaction.showModal(modal);
          return;
        }

        if (interaction.customId === CustomIds.ticketCloseButton) {
          await handleTicketClose(interaction);
          return;
        }

        return;
      }

      if (interaction.isModalSubmit()) {
        if (interaction.customId === CustomIds.feedbackSubmitModal) {
          const licenseKey = interaction.fields.getTextInputValue("feedback-license-key");
          const feedbackText = interaction.fields.getTextInputValue("feedback-message");

          await interaction.deferReply({ ephemeral: true });

          try {
            await sendFeedbackLog(interaction, licenseKey, feedbackText);
            await interaction.editReply("Teşekkürler! Geri bildiriminiz başarıyla iletildi.");
          } catch (error) {
            const message = error instanceof Error ? error.message : "Geri bildirim gönderilirken bir hata oluştu.";
            await interaction.editReply(message);
          }

          return;
        }

        if (interaction.customId === CustomIds.ticketLicenseSupportModal) {
          await interaction.deferReply({ ephemeral: true });

          try {
            await createLicenseTicket(interaction, "Support / Teknik Destek", interaction.customId);
            await interaction.editReply("Lisans doğrulandı. Yetkili bileti oluşturuldu.");
          } catch (error) {
            const message = error instanceof Error ? error.message : "Ticket oluşturulurken hata oluştu.";
            await interaction.editReply(message);
          }

          return;
        }

        if (interaction.customId === CustomIds.ticketLicenseInquiryModal) {
          await interaction.deferReply({ ephemeral: true });

          try {
            await createLicenseTicket(interaction, "Product Inquiry / Ürün Sorgula", interaction.customId);
            await interaction.editReply("Lisans doğrulandı. Ürün sorgulama bileti oluşturuldu.");
          } catch (error) {
            const message = error instanceof Error ? error.message : "Ticket oluşturulurken hata oluştu.";
            await interaction.editReply(message);
          }

          return;
        }

        return;
      }

      if (interaction.isStringSelectMenu()) {
        if (interaction.customId === CustomIds.adminProductDeleteSelect) {
          const selectedProductId = interaction.values[0];

          if (!selectedProductId) {
            await interaction.update({ content: "Geçersiz ürün seçimi yapıldı.", embeds: [], components: [] });
            return;
          }

          const removedProduct = await productStore.removeById(selectedProductId);

          if (!removedProduct) {
            await interaction.update({ content: "Seçilen ürün artık bulunmuyor.", embeds: [], components: [] });
            return;
          }

          interaction.client.products.delete(selectedProductId);

          await interaction.update({
            content: `Ürün silindi: **${removedProduct.name}** - **${removedProduct.price}**`,
            embeds: [],
            components: [],
          });

          return;
        }

        if (interaction.customId === CustomIds.ticketPurchaseSelect) {
          const selectedProductId = interaction.values[0];

          if (!selectedProductId) {
            await interaction.update({ content: "Geçersiz ürün seçimi yapıldı.", embeds: [], components: [] });
            return;
          }

          const product = interaction.client.products.get(selectedProductId);

          if (!product) {
            await interaction.update({ content: "Seçilen ürün artık bulunmuyor.", embeds: [], components: [] });
            return;
          }

          await createPurchaseTicket(interaction, product);

          await interaction.update({
            content: `Satın alma biletiniz oluşturuldu: **${product.name}**`,
            embeds: [],
            components: [],
          });

          return;
        }

        return;
      }
    } catch (error) {
      console.error("Interaction işlenirken hata oluştu:", error);

      const response = {
        content: "İşlem sırasında beklenmeyen bir hata oluştu.",
        ephemeral: true,
      };

      if (interaction.isRepliable()) {
        if (interaction.deferred || interaction.replied) {
          await interaction.followUp(response).catch(() => undefined);
        } else {
          await interaction.reply(response).catch(() => undefined);
        }
      }

      return;
    }
  },
};

export default interactionCreateEvent;

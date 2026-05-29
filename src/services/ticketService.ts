import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  Colors,
  EmbedBuilder,
  PermissionsBitField,
  StringSelectMenuBuilder,
  type CacheType,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type ModalSubmitInteraction,
  type StringSelectMenuInteraction,
  type TextChannel,
} from "discord.js";

import { env } from "../config/env.js";
import { CustomIds } from "../constants/customIds.js";
import type { Product } from "../types/Product.js";

function getManagementMention(): string {
  return env.managementRoleId ? `<@&${env.managementRoleId}>` : "Management";
}

function buildTicketButtons(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(CustomIds.ticketPurchaseButton).setLabel("🛒 Purchase / Satın Alma").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(CustomIds.ticketSupportButton).setLabel("✉️ Support / Teknik Destek").setStyle(ButtonStyle.Secondary),
    new ButtonBuilder().setCustomId(CustomIds.ticketInquiryButton).setLabel("ℹ️ Product Inquiry / Ürün Sorgula").setStyle(ButtonStyle.Secondary),
  );
}

function buildCloseButton(): ActionRowBuilder<ButtonBuilder> {
  return new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder().setCustomId(CustomIds.ticketCloseButton).setLabel("❌ Close Ticket / Ticketi Kapat").setStyle(ButtonStyle.Danger),
  );
}

function buildTicketPanelEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.DarkRed)
    .setTitle("Ticket System / Destek Sistemi")
    .setDescription(
      [
        "**EN:** Use the buttons below to open a purchase, support, or product inquiry ticket.",
        "**TR:** Aşağıdaki butonları kullanarak satın alma, teknik destek veya ürün sorgulama bileti açabilirsiniz.",
        "",
        "Each ticket is created in a private channel and only you, the bot, and configured staff can see it.",
        "Her bilet özel bir kanalda oluşturulur ve yalnızca siz, bot ve yapılandırılmış yetkililer görebilir.",
      ].join("\n"),
    )
    .setTimestamp();
}

function buildFeedbackPanelEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.Blurple)
    .setTitle("Feedback System / Geri Bildirim Sistemi")
    .setDescription(
      [
        "**EN:** Share your feedback using the button below.",
        "**TR:** Geri bildiriminizi aşağıdaki butonla gönderebilirsiniz.",
        "",
        "Your submission will be sent to the configured feedback log channel.",
        "Gönderiminiz yapılandırılmış geri bildirim log kanalına iletilecektir.",
      ].join("\n"),
    )
    .setTimestamp();
}

export function createFeedbackPanelComponents(): ActionRowBuilder<ButtonBuilder>[] {
  return [
    new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setCustomId(CustomIds.feedbackOpenModalButton).setLabel("✍️ Submit Feedback / Geri Bildirim Gönder").setStyle(ButtonStyle.Primary),
    ),
  ];
}

export function createTicketPanelComponents(): ActionRowBuilder<ButtonBuilder>[] {
  return [buildTicketButtons()];
}

export function createTicketPanelEmbedForChannel(): EmbedBuilder {
  return buildTicketPanelEmbed();
}

export function createFeedbackPanelEmbedForChannel(): EmbedBuilder {
  return buildFeedbackPanelEmbed();
}

export function createPurchaseSelectMenu(products: Product[]): ActionRowBuilder<StringSelectMenuBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(CustomIds.ticketPurchaseSelect)
    .setPlaceholder("Ürün Seçin / Select a Product")
    .addOptions(
      products.slice(0, 25).map((product) => ({
        label: product.name.slice(0, 100),
        value: product.id,
        description: product.price.slice(0, 100),
      })),
    );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

export function buildPurchaseSelectionPayload(products: Product[]) {
  return {
    embeds: [
      new EmbedBuilder()
        .setColor(Colors.DarkRed)
        .setTitle("Ticket System (Product Selection / Ürün Seçimi)")
        .setDescription(
          [
            "Select one of the listed products to automatically create a private purchase ticket.",
            "Listelenen ürünlerden birini seçerek otomatik olarak özel bir satın alma bileti oluşturabilirsiniz.",
          ].join("\n"),
        )
        .setTimestamp(),
    ],
    components: [createPurchaseSelectMenu(products)],
  };
}

function buildTicketEmbed(title: string, bodyLines: string[], product?: Product, licenseKey?: string): EmbedBuilder {
  const embed = new EmbedBuilder().setColor(Colors.DarkRed).setTitle(title).setDescription(bodyLines.join("\n")).setTimestamp();

  if (product) {
    embed.addFields(
      { name: "Selected Product / Seçilen Ürün", value: product.name, inline: false },
      { name: "Product Price / Ürün Fiyatı", value: product.price, inline: false },
    );
  }

  if (licenseKey) {
    embed.addFields({ name: "License Key / Lisans Anahtarı", value: licenseKey, inline: false });
  }

  return embed;
}

async function createPrivateTicketChannel(
  interaction: ChatInputCommandInteraction | StringSelectMenuInteraction | ModalSubmitInteraction | ButtonInteraction,
  channelName: string,
  embed: EmbedBuilder,
): Promise<TextChannel> {
  if (!interaction.inCachedGuild()) {
    throw new Error("Bu işlem yalnızca önbelleğe alınmış sunucularda kullanılabilir.");
  }

  const guild = interaction.guild;

  const overwriteList = [
    { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
    { id: guild.members.me?.id ?? interaction.client.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.EmbedLinks] },
    { id: interaction.user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.EmbedLinks] },
    ...(env.managementRoleId ? [{ id: env.managementRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory, PermissionsBitField.Flags.AttachFiles, PermissionsBitField.Flags.EmbedLinks] }] : []),
  ];

  const channel = env.ticketCategoryId
    ? await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        parent: env.ticketCategoryId,
        topic: `${interaction.user.tag} tarafından açılan özel ticket kanalı.`,
        permissionOverwrites: overwriteList,
      })
    : await guild.channels.create({
        name: channelName,
        type: ChannelType.GuildText,
        topic: `${interaction.user.tag} tarafından açılan özel ticket kanalı.`,
        permissionOverwrites: overwriteList,
      });

  await channel.send({
    content: `${getManagementMention()} ${interaction.user}`,
    embeds: [embed],
    components: [buildCloseButton()],
  });

  return channel;
}

export async function handleFeedbackSubmission(interaction: ModalSubmitInteraction<CacheType>): Promise<void> {
  const licenseKey = interaction.fields.getTextInputValue("feedback-license-key");
  const feedbackText = interaction.fields.getTextInputValue("feedback-message");

  if (!interaction.inCachedGuild()) {
    throw new Error("Bu işlem yalnızca önbelleğe alınmış sunucularda kullanılabilir.");
  }

  await interaction.deferReply({ ephemeral: true });

  if (!env.feedbackLogChannelId) {
    await interaction.editReply("Feedback log kanalı tanımlı değil. Lütfen yapılandırmayı kontrol edin.");
    return;
  }

  const guildChannel = interaction.guild.channels.cache.get(env.feedbackLogChannelId);

  if (!guildChannel || !guildChannel.isTextBased()) {
    await interaction.editReply("Feedback log kanalı bulunamadı veya mesaj gönderilemez durumda.");
    return;
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

  await guildChannel.send({ embeds: [embed] });
  await interaction.editReply("Teşekkürler! Geri bildiriminiz başarıyla iletildi.");
}

async function logTicketCreation(interaction: ModalSubmitInteraction<CacheType> | StringSelectMenuInteraction<CacheType>, embed: EmbedBuilder): Promise<void> {
  if (!env.ticketLogChannelId) {
    return;
  }

  if (!interaction.inCachedGuild()) {
    return;
  }

  const logChannel = interaction.guild.channels.cache.get(env.ticketLogChannelId);

  if (!logChannel || !logChannel.isTextBased()) {
    return;
  }

  await logChannel.send({ embeds: [embed] });
}

export async function createPurchaseTicket(interaction: StringSelectMenuInteraction<CacheType>, product: Product): Promise<void> {
  if (!interaction.inCachedGuild()) {
    throw new Error("Bu işlem yalnızca önbelleğe alınmış sunucularda kullanılabilir.");
  }

  const channel = await createPrivateTicketChannel(
    interaction,
    `purchase-${interaction.user.id}`,
    buildTicketEmbed(
      "Ticket System (Purchase Request / Satın Alma)",
      [
        "A purchase ticket has been created for the selected product.",
        "Seçilen ürün için bir satın alma bileti oluşturuldu.",
      ],
      product,
    ),
  );

  const ticketLogEmbed = new EmbedBuilder()
    .setColor(Colors.DarkRed)
    .setTitle("New Purchase Ticket / Yeni Satın Alma Bileti")
    .addFields(
      { name: "User", value: `${interaction.user} (${interaction.user.tag})`, inline: false },
      { name: "Channel", value: `${channel}`, inline: false },
      { name: "Selected Product / Seçilen Ürün", value: product.name, inline: false },
      { name: "Product Price / Ürün Fiyatı", value: product.price, inline: false },
    )
    .setTimestamp();

  await logTicketCreation(interaction, ticketLogEmbed);
}

export async function createLicenseTicket(interaction: ModalSubmitInteraction<CacheType>, ticketType: "Support / Teknik Destek" | "Product Inquiry / Ürün Sorgula", sourceCustomId: string): Promise<void> {
  const licenseKey = interaction.fields.getTextInputValue("ticket-license-key");

  if (!interaction.inCachedGuild()) {
    throw new Error("Bu işlem yalnızca önbelleğe alınmış sunucularda kullanılabilir.");
  }

  const channelPrefix = sourceCustomId === CustomIds.ticketLicenseSupportModal ? "support" : "inquiry";
  const channel = await createPrivateTicketChannel(
    interaction,
    `${channelPrefix}-${interaction.user.id}`,
    buildTicketEmbed(
      `Ticket System (${ticketType} / Lisans Doğrulama)`,
      [
        "A verification ticket has been created after license confirmation.",
        "Lisans doğrulaması sonrası bir bilet kanalı oluşturuldu.",
      ],
      undefined,
      licenseKey,
    ),
  );

  const ticketLogEmbed = new EmbedBuilder()
    .setColor(Colors.DarkRed)
    .setTitle(`New ${ticketType} Ticket / Yeni ${ticketType} Bileti`)
    .addFields(
      { name: "User", value: `${interaction.user} (${interaction.user.tag})`, inline: false },
      { name: "Channel", value: `${channel}`, inline: false },
      { name: "License Key / Lisans Anahtarı", value: licenseKey, inline: false },
    )
    .setTimestamp();

  await logTicketCreation(interaction, ticketLogEmbed);
}

export async function handleTicketClose(interaction: ButtonInteraction<CacheType>): Promise<void> {
  const channel = interaction.channel;

  if (!interaction.inCachedGuild() || !channel || channel.type !== ChannelType.GuildText) {
    await interaction.reply({ content: "Bu işlem yalnızca özel ticket kanallarında kullanılabilir.", ephemeral: true });
    return;
  }

  await interaction.reply({ content: "Ticket kapatılıyor...", ephemeral: true });
  await channel.delete("Ticket closed by button interaction.");
}

export function buildFeedbackSetupPayload() {
  return {
    embeds: [buildFeedbackPanelEmbed()],
    components: createFeedbackPanelComponents(),
  };
}

export function buildTicketSetupPayload() {
  return {
    embeds: [buildTicketPanelEmbed()],
    components: createTicketPanelComponents(),
  };
}

export function buildProductDeleteMenu(products: Product[]): ActionRowBuilder<StringSelectMenuBuilder> {
  const menu = new StringSelectMenuBuilder()
    .setCustomId(CustomIds.adminProductDeleteSelect)
    .setPlaceholder("Silinecek ürünü seçin")
    .addOptions(
      products.slice(0, 25).map((product) => ({
        label: product.name.slice(0, 100),
        value: product.id,
        description: product.price.slice(0, 100),
      })),
    );

  return new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
}

export function buildProductDeleteNotice(productsCount: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(Colors.Orange)
    .setTitle("Ürün Silme Paneli")
    .setDescription(
      productsCount === 0
        ? "Sistemde silinecek ürün bulunmuyor."
        : "Aşağıdaki menüden silmek istediğiniz ürünü seçin."
    )
    .setTimestamp();
}

function readRequiredEnv(name) {
    const value = process.env[name]?.trim();
    if (!value) {
        throw new Error(`Eksik zorunlu ortam değişkeni: ${name}`);
    }
    return value;
}
function readOptionalEnv(name) {
    const value = process.env[name]?.trim();
    return value && value.length > 0 ? value : undefined;
}
function readBooleanEnv(name, defaultValue) {
    const value = process.env[name]?.trim().toLowerCase();
    if (!value) {
        return defaultValue;
    }
    return ["1", "true", "yes", "on"].includes(value);
}
function createEnvironment() {
    const guildId = readOptionalEnv("DISCORD_GUILD_ID");
    const managementRoleId = readOptionalEnv("MANAGEMENT_ROLE_ID");
    const feedbackLogChannelId = readOptionalEnv("FEEDBACK_LOG_CHANNEL_ID");
    const ticketLogChannelId = readOptionalEnv("TICKET_LOG_CHANNEL_ID");
    const ticketCategoryId = readOptionalEnv("TICKET_CATEGORY_ID");
    const baseEnvironment = {
        token: readRequiredEnv("DISCORD_TOKEN"),
        clientId: readRequiredEnv("DISCORD_CLIENT_ID"),
        ...(guildId ? { guildId } : {}),
        ...(managementRoleId ? { managementRoleId } : {}),
        ...(feedbackLogChannelId ? { feedbackLogChannelId } : {}),
        ...(ticketLogChannelId ? { ticketLogChannelId } : {}),
        ...(ticketCategoryId ? { ticketCategoryId } : {}),
        deployGlobalCommands: readBooleanEnv("DEPLOY_GLOBAL_COMMANDS", true),
        deployGuildCommands: readBooleanEnv("DEPLOY_GUILD_COMMANDS", true),
    };
    return baseEnvironment;
}
export const env = createEnvironment();

const readyEvent = {
    name: "ready",
    once: true,
    async execute(client) {
        const tag = client.user.tag;
        const commandCount = client.commands.size;
        console.info(`Giriş yapıldı: ${tag}`);
        console.info(`Hazır: ${commandCount} slash command aktif.`);
    },
};
export default readyEvent;

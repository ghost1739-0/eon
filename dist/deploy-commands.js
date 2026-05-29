import "dotenv/config";
import { REST } from "@discordjs/rest";
import { Routes } from "discord-api-types/v10";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./config/env.js";
import { loadSlashCommands } from "./utils/moduleLoader.js";
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)));
async function main() {
    const commandsDirectory = path.join(projectRoot, "commands");
    const commands = await loadSlashCommands(commandsDirectory);
    const commandBodies = commands.map((command) => command.data.toJSON());
    const rest = new REST({ version: "10" }).setToken(env.token);
    if (env.deployGlobalCommands) {
        await rest.put(Routes.applicationCommands(env.clientId), {
            body: commandBodies,
        });
        console.info(`Global komutlar yüklendi: ${commandBodies.length}`);
    }
    if (env.deployGuildCommands) {
        if (!env.guildId) {
            console.info("Guild deploy atlandı: DISCORD_GUILD_ID tanımlı değil.");
        }
        else {
            await rest.put(Routes.applicationGuildCommands(env.clientId, env.guildId), {
                body: commandBodies,
            });
            console.info(`Guild komutlar yüklendi (${env.guildId}): ${commandBodies.length}`);
        }
    }
}
main().catch((error) => {
    console.error("Komut deploy işlemi başarısız oldu.", error);
    process.exitCode = 1;
});

import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
const runtimeExtension = path.extname(fileURLToPath(import.meta.url));
async function collectRuntimeFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = await Promise.all(entries.map(async (entry) => {
        const entryPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
            return collectRuntimeFiles(entryPath);
        }
        return entry.isFile() && entry.name.endsWith(runtimeExtension) ? [entryPath] : [];
    }));
    return files.flat();
}
function isSlashCommand(value) {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const candidate = value;
    return typeof candidate.execute === "function" && typeof candidate.data?.toJSON === "function";
}
function isBotEvent(value) {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const candidate = value;
    return typeof candidate.name === "string" && typeof candidate.execute === "function";
}
export async function loadSlashCommands(commandsDirectory) {
    const files = await collectRuntimeFiles(commandsDirectory);
    const commands = [];
    for (const file of files) {
        const loadedModule = await import(pathToFileURL(file).href);
        const command = loadedModule.default;
        if (!isSlashCommand(command)) {
            throw new Error(`Geçersiz slash command modülü: ${file}`);
        }
        commands.push(command);
    }
    return commands;
}
export async function loadBotEvents(eventsDirectory) {
    const files = await collectRuntimeFiles(eventsDirectory);
    const events = [];
    for (const file of files) {
        const loadedModule = await import(pathToFileURL(file).href);
        const event = loadedModule.default;
        if (!isBotEvent(event)) {
            throw new Error(`Geçersiz event modülü: ${file}`);
        }
        events.push(event);
    }
    return events;
}

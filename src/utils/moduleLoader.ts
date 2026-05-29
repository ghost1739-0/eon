import { readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import type { BotEvent } from "../types/BotEvent.js";
import type { SlashCommand } from "../types/SlashCommand.js";

const runtimeExtension = path.extname(fileURLToPath(import.meta.url));

async function collectRuntimeFiles(directory: string): Promise<string[]> {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return collectRuntimeFiles(entryPath);
      }

      return entry.isFile() && entry.name.endsWith(runtimeExtension) ? [entryPath] : [];
    }),
  );

  return files.flat();
}

function isSlashCommand(value: unknown): value is SlashCommand {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<SlashCommand>;
  return typeof candidate.execute === "function" && typeof candidate.data?.toJSON === "function";
}

function isBotEvent(value: unknown): value is BotEvent {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<BotEvent>;
  return typeof candidate.name === "string" && typeof candidate.execute === "function";
}

export async function loadSlashCommands(commandsDirectory: string): Promise<SlashCommand[]> {
  const files = await collectRuntimeFiles(commandsDirectory);
  const commands: SlashCommand[] = [];

  for (const file of files) {
    const loadedModule = await import(pathToFileURL(file).href);
    const command = loadedModule.default as unknown;

    if (!isSlashCommand(command)) {
      throw new Error(`Geçersiz slash command modülü: ${file}`);
    }

    commands.push(command);
  }

  return commands;
}

export async function loadBotEvents(eventsDirectory: string): Promise<BotEvent[]> {
  const files = await collectRuntimeFiles(eventsDirectory);
  const events: BotEvent[] = [];

  for (const file of files) {
    const loadedModule = await import(pathToFileURL(file).href);
    const event = loadedModule.default as unknown;

    if (!isBotEvent(event)) {
      throw new Error(`Geçersiz event modülü: ${file}`);
    }

    events.push(event);
  }

  return events;
}

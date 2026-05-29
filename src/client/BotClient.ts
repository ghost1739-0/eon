import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { productStore } from "../storage/productStore.js";
import type { Product } from "../types/Product.js";
import type { SlashCommand } from "../types/SlashCommand.js";
import { loadBotEvents, loadSlashCommands } from "../utils/moduleLoader.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export class BotClient extends Client {
  public readonly commands = new Collection<string, SlashCommand>();
  public readonly products = new Collection<string, Product>();

  public constructor() {
    super({
      intents: [GatewayIntentBits.Guilds],
      partials: [Partials.Channel],
    });
  }

  public async initialize(): Promise<void> {
    await this.loadProducts();
    await Promise.all([this.loadCommands(), this.loadEvents()]);
  }

  private async loadProducts(): Promise<void> {
    await productStore.load();

    this.products.clear();

    for (const product of productStore.list()) {
      this.products.set(product.id, product);
    }

    console.info(`Yüklendi: ${this.products.size} ürün.`);
  }

  private async loadCommands(): Promise<void> {
    const commandsDirectory = path.join(projectRoot, "commands");
    const commands = await loadSlashCommands(commandsDirectory);

    this.commands.clear();

    for (const command of commands) {
      this.commands.set(command.data.toJSON().name, command);
    }

    console.info(`Yüklendi: ${this.commands.size} slash command.`);
  }

  private async loadEvents(): Promise<void> {
    const eventsDirectory = path.join(projectRoot, "events");
    const events = await loadBotEvents(eventsDirectory);

    for (const event of events) {
      const listener = (...args: unknown[]) => {
        void (event.execute as (...eventArgs: unknown[]) => Promise<void>)(...args);
      };

      if (event.once) {
        this.once(event.name, listener as never);
        continue;
      }

      this.on(event.name, listener as never);
    }

    console.info(`Yüklendi: ${events.length} event.`);
  }
}

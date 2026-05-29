import { Client, Collection, GatewayIntentBits, Partials } from "discord.js";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { productStore } from "../storage/productStore.js";
import { loadBotEvents, loadSlashCommands } from "../utils/moduleLoader.js";
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export class BotClient extends Client {
    commands = new Collection();
    products = new Collection();
    constructor() {
        super({
            intents: [GatewayIntentBits.Guilds],
            partials: [Partials.Channel],
        });
    }
    async initialize() {
        await this.loadProducts();
        await Promise.all([this.loadCommands(), this.loadEvents()]);
    }
    async loadProducts() {
        await productStore.load();
        this.products.clear();
        for (const product of productStore.list()) {
            this.products.set(product.id, product);
        }
        console.info(`Yüklendi: ${this.products.size} ürün.`);
    }
    async loadCommands() {
        const commandsDirectory = path.join(projectRoot, "commands");
        const commands = await loadSlashCommands(commandsDirectory);
        this.commands.clear();
        for (const command of commands) {
            this.commands.set(command.data.toJSON().name, command);
        }
        console.info(`Yüklendi: ${this.commands.size} slash command.`);
    }
    async loadEvents() {
        const eventsDirectory = path.join(projectRoot, "events");
        const events = await loadBotEvents(eventsDirectory);
        for (const event of events) {
            const listener = (...args) => {
                void event.execute(...args);
            };
            if (event.once) {
                this.once(event.name, listener);
                continue;
            }
            this.on(event.name, listener);
        }
        console.info(`Yüklendi: ${events.length} event.`);
    }
}

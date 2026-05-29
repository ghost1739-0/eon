import type { Collection } from "discord.js";

import type { SlashCommand } from "./SlashCommand.js";
import type { Product } from "./Product.js";

declare module "discord.js" {
  interface Client {
    commands: Collection<string, SlashCommand>;
    products: Collection<string, Product>;
  }
}

export {};

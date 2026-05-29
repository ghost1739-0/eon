import type { Awaitable, ClientEvents } from "discord.js";

export interface BotEvent<Key extends keyof ClientEvents = keyof ClientEvents> {
  readonly name: Key;
  readonly once?: boolean;
  execute(...args: ClientEvents[Key]): Awaitable<void>;
}

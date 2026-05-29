import { MongoClient, type Db } from "mongodb";

import { env } from "../config/env.js";

let client: MongoClient | undefined;
let database: Db | undefined;

export async function getDatabase(): Promise<Db> {
  if (database) {
    return database;
  }

  if (!client) {
    client = new MongoClient(env.mongoUri);
  }

  await client.connect();

  database = client.db(env.mongoDatabaseName);
  return database;
}

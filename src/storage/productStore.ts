import { randomUUID } from "node:crypto";

import { Collection } from "discord.js";
import type { Collection as MongoCollection } from "mongodb";

import { getDatabase } from "./mongo.js";
import type { Product } from "../types/Product.js";

interface ProductDocument {
  readonly _id: string;
  readonly name: string;
  readonly price: string;
  readonly nameNormalized: string;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function isProductDocument(value: unknown): value is ProductDocument {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<ProductDocument>;
  return (
    typeof candidate._id === "string" &&
    typeof candidate.name === "string" &&
    typeof candidate.price === "string" &&
    typeof candidate.nameNormalized === "string"
  );
}

async function getProductCollection(): Promise<MongoCollection<ProductDocument>> {
  const database = await getDatabase();
  const collection = database.collection<ProductDocument>("products");

  await collection.createIndex({ nameNormalized: 1 }, { unique: true });

  return collection;
}

export class ProductStore {
  public readonly products = new Collection<string, Product>();

  public async load(): Promise<void> {
    const collection = await getProductCollection();
    const items = await collection.find({}).toArray();

    this.products.clear();

    for (const item of items) {
      if (isProductDocument(item)) {
        this.products.set(item._id, {
          id: item._id,
          name: item.name,
          price: item.price,
        });
      }
    }
  }

  public list(): Product[] {
    return [...this.products.values()];
  }

  public getById(id: string): Product | undefined {
    return this.products.get(id);
  }

  public findByName(name: string): Product | undefined {
    const targetName = normalizeName(name);
    return this.list().find((product) => normalizeName(product.name) === targetName);
  }

  public async add(name: string, price: string): Promise<Product> {
    const productName = name.trim();
    const productPrice = price.trim();
    const nameNormalized = normalizeName(productName);

    if (!productName || !productPrice) {
      throw new Error("Ürün adı ve fiyat bilgisi boş olamaz.");
    }

    if (this.findByName(productName)) {
      throw new Error("Bu isimde bir ürün zaten mevcut.");
    }

    const product: Product = {
      id: randomUUID(),
      name: productName,
      price: productPrice,
    };

    const collection = await getProductCollection();

    await collection.insertOne({
      _id: product.id,
      name: product.name,
      price: product.price,
      nameNormalized,
    });

    this.products.set(product.id, product);

    return product;
  }

  public async removeById(id: string): Promise<Product | undefined> {
    const collection = await getProductCollection();
    const product = this.products.get(id);

    if (!product) {
      return undefined;
    }

    await collection.deleteOne({ _id: id });
    this.products.delete(id);

    return product;
  }

  public toSelectOptions(): Array<{ label: string; value: string; description: string }> {
    return this.list().map((product) => ({
      label: product.name.slice(0, 100),
      value: product.id,
      description: product.price.slice(0, 100),
    }));
  }
}

export const productStore = new ProductStore();

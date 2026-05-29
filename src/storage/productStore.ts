import { Collection } from "discord.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";

import type { Product } from "../types/Product.js";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const dataDirectory = path.join(projectRoot, "data");
const productsFilePath = path.join(dataDirectory, "products.json");

function isProduct(value: unknown): value is Product {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<Product>;
  return typeof candidate.id === "string" && typeof candidate.name === "string" && typeof candidate.price === "string";
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

export class ProductStore {
  public readonly products = new Collection<string, Product>();

  public async load(): Promise<void> {
    await mkdir(dataDirectory, { recursive: true });

    let rawFile = "[]";

    try {
      rawFile = await readFile(productsFilePath, "utf8");
    } catch (error) {
      const fileNotFound = typeof error === "object" && error !== null && "code" in error && (error as NodeJS.ErrnoException).code === "ENOENT";

      if (!fileNotFound) {
        throw error;
      }

      await writeFile(productsFilePath, "[]\n", "utf8");
    }

    const parsed = JSON.parse(rawFile) as unknown;
    const items = Array.isArray(parsed) ? parsed : [];

    this.products.clear();

    for (const item of items) {
      if (isProduct(item)) {
        this.products.set(item.id, item);
      }
    }

    await this.save();
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

    this.products.set(product.id, product);
    await this.save();

    return product;
  }

  public async removeById(id: string): Promise<Product | undefined> {
    const product = this.products.get(id);

    if (!product) {
      return undefined;
    }

    this.products.delete(id);
    await this.save();

    return product;
  }

  public toSelectOptions(): Array<{ label: string; value: string; description: string }> {
    return this.list().map((product) => ({
      label: product.name.slice(0, 100),
      value: product.id,
      description: product.price.slice(0, 100),
    }));
  }

  private async save(): Promise<void> {
    await mkdir(dataDirectory, { recursive: true });
    await writeFile(productsFilePath, `${JSON.stringify(this.list(), null, 2)}\n`, "utf8");
  }
}

export const productStore = new ProductStore();

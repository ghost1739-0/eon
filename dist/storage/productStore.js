import { Collection } from "discord.js";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const dataDirectory = path.join(projectRoot, "data");
const productsFilePath = path.join(dataDirectory, "products.json");
function isProduct(value) {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const candidate = value;
    return typeof candidate.id === "string" && typeof candidate.name === "string" && typeof candidate.price === "string";
}
function normalizeName(name) {
    return name.trim().toLowerCase();
}
export class ProductStore {
    products = new Collection();
    async load() {
        await mkdir(dataDirectory, { recursive: true });
        let rawFile = "[]";
        try {
            rawFile = await readFile(productsFilePath, "utf8");
        }
        catch (error) {
            const fileNotFound = typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
            if (!fileNotFound) {
                throw error;
            }
            await writeFile(productsFilePath, "[]\n", "utf8");
        }
        const parsed = JSON.parse(rawFile);
        const items = Array.isArray(parsed) ? parsed : [];
        this.products.clear();
        for (const item of items) {
            if (isProduct(item)) {
                this.products.set(item.id, item);
            }
        }
        await this.save();
    }
    list() {
        return [...this.products.values()];
    }
    getById(id) {
        return this.products.get(id);
    }
    findByName(name) {
        const targetName = normalizeName(name);
        return this.list().find((product) => normalizeName(product.name) === targetName);
    }
    async add(name, price) {
        const productName = name.trim();
        const productPrice = price.trim();
        if (!productName || !productPrice) {
            throw new Error("Ürün adı ve fiyat bilgisi boş olamaz.");
        }
        if (this.findByName(productName)) {
            throw new Error("Bu isimde bir ürün zaten mevcut.");
        }
        const product = {
            id: randomUUID(),
            name: productName,
            price: productPrice,
        };
        this.products.set(product.id, product);
        await this.save();
        return product;
    }
    async removeById(id) {
        const product = this.products.get(id);
        if (!product) {
            return undefined;
        }
        this.products.delete(id);
        await this.save();
        return product;
    }
    toSelectOptions() {
        return this.list().map((product) => ({
            label: product.name.slice(0, 100),
            value: product.id,
            description: product.price.slice(0, 100),
        }));
    }
    async save() {
        await mkdir(dataDirectory, { recursive: true });
        await writeFile(productsFilePath, `${JSON.stringify(this.list(), null, 2)}\n`, "utf8");
    }
}
export const productStore = new ProductStore();

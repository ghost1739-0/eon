import { randomUUID } from "node:crypto";
import { Collection } from "discord.js";
import { getDatabase } from "./mongo.js";
function normalizeName(name) {
    return name.trim().toLowerCase();
}
function isProductDocument(value) {
    if (typeof value !== "object" || value === null) {
        return false;
    }
    const candidate = value;
    return (typeof candidate._id === "string" &&
        typeof candidate.name === "string" &&
        typeof candidate.price === "string" &&
        typeof candidate.nameNormalized === "string");
}
async function getProductCollection() {
    const database = await getDatabase();
    const collection = database.collection("products");
    await collection.createIndex({ nameNormalized: 1 }, { unique: true });
    return collection;
}
export class ProductStore {
    products = new Collection();
    async load() {
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
        const nameNormalized = normalizeName(productName);
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
    async removeById(id) {
        const collection = await getProductCollection();
        const product = this.products.get(id);
        if (!product) {
            return undefined;
        }
        await collection.deleteOne({ _id: id });
        this.products.delete(id);
        return product;
    }
    toSelectOptions() {
        return this.list().map((product) => ({
            label: product.name.slice(0, 100),
            value: product.id,
            description: product.price.slice(0, 100),
        }));
    }
}
export const productStore = new ProductStore();

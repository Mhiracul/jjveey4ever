import "dotenv/config";
import mongoose from "mongoose";
import RegistryItem from "./models/RegistryItem.js";

await mongoose.connect(process.env.MONGODB_URI);
const items = [
  { name: "Dinner Set", naira: 200000, pounds: 100, sortOrder: 1 },
  { name: "Kitchen Essentials", naira: 400000, pounds: 200, sortOrder: 2 },
  { name: "Bedroom Comforts", naira: 300000, pounds: 150, sortOrder: 3 },
];
for (const item of items) await RegistryItem.updateOne({ name: item.name }, { $setOnInsert: item }, { upsert: true });
console.log("Registry seed complete.");
await mongoose.disconnect();

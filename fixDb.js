import mongoose from "mongoose";
import dotenv from "dotenv";
import { Branch } from "./src/models/branch.model.js";
dotenv.config();

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    await Branch.updateOne({ name: "Kilpauk (Main) Branch" }, { $set: { coordinates: { lat: 13.084822, lng: 80.2457094 } } });
    await Branch.updateOne({ name: "T.Nagar branch" }, { $set: { coordinates: { lat: 13.0473316, lng: 80.2337802 } } });
    await Branch.updateOne({ name: "Pallikaranai branch" }, { $set: { coordinates: { lat: 12.9348, lng: 80.2137 } } });
    console.log("DB Updated with coordinates.");
    process.exit(0);
});

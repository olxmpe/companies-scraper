import express from "express";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

const app = express();
const PORT = 3001; // Port pour le WebSocket Server

// Lancer le serveur HTTP Express
const server = app.listen(PORT, () => {
    console.log(`✅ Serveur WebSocket lancé sur ws://localhost:${PORT}`);
});

// WebSocket Server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
    console.log("📡 Client connecté au WebSocket");

    ws.on("message", async (message) => {
        const { zipCode, sectors } = JSON.parse(message.toString());

        console.log(`🔍 Recherche pour ${sectors.join(", ")} à ${zipCode}`);

        try {
            const results = await searchGoogle(sectors, zipCode);

            ws.send(JSON.stringify({ status: "success", results }));
        } catch (error) {
            ws.send(JSON.stringify({ status: "error", message: "Erreur lors de la recherche" }));
        }
    });
});

async function searchGoogle(sectors: string[], zipCode: number) {
    const API_KEY = process.env.GOOGLE_API_KEY;
    const CX = process.env.GOOGLE_CX;
    const queries = sectors.map((sector) => `${sector} ${zipCode} contact email`);
    let results: any[] = [];

    for (const query of queries) {
        console.log(`🔎 Recherche Google : ${query}`);

        try {
            const response = await axios.get("https://customsearch.googleapis.com/customsearch/v1", {
                params: {
                    key: API_KEY,
                    cx: CX,
                    q: query,
                    num: 10,
                },
            });

            results.push(...response.data.items);
        } catch (error:any) {
            console.error("❌ Erreur Google API :", error.response?.data || error.message);
        }
    }

    return results;
}
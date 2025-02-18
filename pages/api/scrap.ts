import type {NextApiRequest, NextApiResponse} from "next";
import axios from "axios";

interface ScrapRequest {
    zipCode: string;
    sectors: string[];
}

interface ScrapResult {
    name: string;
    email: string;
    sector: string;
    zipCode: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Méthode non autorisée" });
    }

    const { zipCode, sectors }: ScrapRequest = req.body;
    if (!zipCode || !sectors || !sectors.length) {
        return res.status(400).json({ error: "Paramètres invalides" });
    }

    const API_KEY = process.env.GOOGLE_API_KEY;
    const CX = process.env.GOOGLE_CX;

    console.log("env vars", CX, API_KEY);
    const ws = new WebSocket("ws://localhost:3001");

    try {
        let results: ScrapResult[] = [];

        for (const sector of sectors) {
            const query = `${sector} ${zipCode} contact email`;
            const url = `https://customsearch.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${CX}&key=${API_KEY}`;

            const response = await axios.get(url);
            const items = response.data.items || [];

            for (const item of items) {
                if (item.link.includes("@")) {
                    results.push({
                        name: item.title,
                        email: item.link,
                        sector,
                        zipCode,
                    });
                }
            }

            ws.send(JSON.stringify({ progress: `${sector} scrappé`, count: results.length }));
        }

        ws.send(JSON.stringify({ done: true, total: results.length }));
        res.status(200).json({ message: "Scraping terminé", data: results });
    } catch (error) {
        ws.send(JSON.stringify({ error: "Erreur de scraping" }));
        res.status(500).json({ error: "Erreur serveur" });
    }
}
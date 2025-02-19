import express from "express";
import { WebSocketServer } from "ws";
import dotenv from "dotenv";
import axios from "axios";
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import Database from 'better-sqlite3';

dotenv.config();

const app = express();
const PORT = 3001;

// Lancer le serveur HTTP Express
const server = app.listen(PORT, () => {
    console.log(`✅ Serveur WebSocket lancé sur ws://localhost:${PORT}`);
});


async function openDb() {
    return open({
        filename: './emails.db',
        driver: sqlite3.Database,
    });
}

async function createTables() {

    const db = new Database('emails.db');

// Création des tables
    db.exec(`
  CREATE TABLE IF NOT EXISTS exports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS emails (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    export_id INTEGER NOT NULL,
    email TEXT NOT NULL,
    metier TEXT,
    commune TEXT,
    source_url TEXT,
    FOREIGN KEY (export_id) REFERENCES exports(id) ON DELETE CASCADE
  );
`);

    console.log("📊 Base de données initialisée !");
}

// WebSocket Server
const wss = new WebSocketServer({ server });

wss.on("connection", (ws) => {
    console.log("📡 Client connecté au WebSocket");

    ws.on("message", async (message) => {
        const { cities, sectors, export_name } = JSON.parse(message.toString());

        console.log(`🔍 Recherche pour les secteurs: ${sectors.join(", ")} dans les villes: ${cities.join(", ")}`);

        try {
            await createTables(); // À exécuter une seule fois au début

            const emails = await searchEmails(sectors, cities, export_name);
            ws.send(JSON.stringify({ status: "success", emails }));
        } catch (error) {
            console.error("❌ Erreur lors de la recherche :", error);
            ws.send(JSON.stringify({ status: "error", message: "Erreur lors de la recherche" }));
        }
    });
});

async function searchEmails(sectors: string[], cities: string[], export_name: string) {
    const API_KEY = process.env.GOOGLE_API_KEY;
    const CX = process.env.GOOGLE_CX;
    console.log(".env", API_KEY, CX)
    let emailSet = new Set<string>(); // Utilisation d'un Set pour éviter les doublons

    for (const city of cities) {
        for (const sector of sectors) {
            const query = `${sector} ${city} contact email`;
            console.log(`🔎 Recherche Google : ${query}`);

            try {
                const response = await axios.get("https://customsearch.googleapis.com/customsearch/v1", {
                    params: {
                        key: API_KEY,
                        cx: CX,
                        q: query,
                        num: 5,
                    },
                });
                console.log(response.data.items);
                // Extraire les e-mails des résultats de recherche
                if (response.data.items) {
                    const testExtract = findEmailsFromSearchResults(response.data, sector, city, "test" )
                    response.data.items.forEach((item: any) => {

                        const emails = extractEmails(item.snippet + " " + (item.htmlSnippet || ""));
                        emails.forEach((email) => emailSet.add(email));
                    });
                }
            } catch (error: any) {
                console.error("❌ Erreur Google API :", error.response?.data || error.message);
            }
        }
    }

    return Array.from(emailSet); // Conversion du Set en tableau pour le retour
}

// Fonction pour extraire les adresses e-mail d'un texte
function extractEmails(text: string): string[] {
    const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
    return text.match(emailRegex) || [];
}

// Fonction pour récupérer le HTML d'une page
async function fetchPageHTML(url: string): Promise<string | null> {
    try {
        const { data } = await axios.get(url);
        return data;
    } catch (error) {
        console.error(`Erreur de chargement de la page ${url}:`, error);
        return null;
    }
}

async function findEmailsFromSearchResults(searchResults: any, metier: string, commune: string, nom_export: string) {
    const export_id = await getOrCreateExport(nom_export); // Associer les emails à un export

    const contactLinks = searchResults.items
        .map((item) => item.link)
        .filter((url) => /contact|about|nous-contacter/i.test(url));

    for (const url of contactLinks) {
        console.log(`🔎 Scraping: ${url}`);
        const html = await fetchPageHTML(url);
        if (html) {
            const emails = extractEmails(html);
            for (const email of emails) {
                await insertEmail(email, metier, commune, export_id);
            }
        }
    }
}

async function insertEmail(email: string, metier: string, commune: string, export_id: number) {
    const db = await openDb();

    try {
        await db.run(
            `INSERT INTO emails (email, metier, commune, export_id) VALUES (?, ?, ?, ?)`,
            [email, metier, commune, export_id]
        );
        console.log(`✅ Email ajouté: ${email}`);
    } catch (error) {
        if (error.code === 'SQLITE_CONSTRAINT') {
            console.log(`⚠️ Email déjà existant: ${email}`);
        } else {
            console.error(`❌ Erreur lors de l'insertion:`, error);
        }
    } finally {
        await db.close();
    }
}

async function getOrCreateExport(nom_export: string) {
    const db = await openDb();

    // Vérifier si l'export existe déjà
    const existingExport = await db.get(`SELECT id FROM exports WHERE name = ?`, [nom_export]);

    if (existingExport) {
        await db.close();
        return existingExport.id; // Retourne l'ID de l'export existant
    }

    // Insérer un nouvel export et récupérer son ID
    const result = await db.run(`INSERT INTO exports (name) VALUES (?)`, [nom_export]);
    await db.close();
    return result.lastID;
}

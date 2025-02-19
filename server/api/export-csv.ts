import { defineEventHandler, readBody } from 'h3';
import Database from 'better-sqlite3';
import { parse } from 'json2csv';
import fs from 'fs';
import path from 'path';
import { WebSocketServer } from 'ws';

const db = new Database('./emails.db');
const wss = new WebSocketServer({ port: 3002 });

wss.on('connection', (ws) => {
    console.log('Client connected for CSV generation');

    ws.on('message', (message) => {
        const { exportId } = JSON.parse(message.toString());
        generateCSV(exportId, ws);
    });
});

async function generateCSV(exportId: number, ws: any) {
    try {
        console.log(`Génération du CSV pour l'export ID: ${exportId}`);
        ws.send(JSON.stringify({ status: 'processing', message: 'Génération du CSV en cours...', exportId }));

        const emails = db.prepare('SELECT email FROM emails WHERE export_id = ?').all(exportId);

        if (emails.length === 0) {
            ws.send(JSON.stringify({ status: 'error', message: 'Aucun email trouvé pour cet export.', exportId }));
            return;
        }

        const exportInfo = db.prepare('SELECT name, created_at FROM exports WHERE id = ?').get(exportId);
        const exportName = exportInfo.name;
        const createdAt = new Date(exportInfo.created_at).toISOString().split('T')[0];

        const csv = parse(emails);
        const filename = `export_${exportName}_${createdAt}.csv`.replace(/[^a-z0-9_.-]/gi, '_');
        const filepath = path.join('downloads', filename);

        if (!fs.existsSync('downloads')) {
            fs.mkdirSync('downloads');
        }

        fs.writeFileSync(filepath, csv);

        // Log pour vérifier l'envoi du message de succès
        console.log(`CSV généré avec succès : ${filename}`);
        ws.send(JSON.stringify({ status: 'success', message: 'CSV généré avec succès.', filename, exportId }));
    } catch (error) {
        console.error("Erreur lors de la génération du CSV :", error);
        ws.send(JSON.stringify({ status: 'error', message: 'Erreur lors de la génération du CSV.', exportId }));
    }
}

export default defineEventHandler(async (event) => {
    const { id } = event.context.params;

    try {
        const exportExists = db.prepare('SELECT 1 FROM exports WHERE id = ?').get(id);

        if (!exportExists) {
            return {
                statusCode: 404,
                body: { error: "Export non trouvé" },
            };
        }

        // Notify clients to start CSV generation
        wss.clients.forEach((client) => {
            if (client.readyState === client.OPEN) {
                client.send(JSON.stringify({ exportId: id }));
            }
        });

        return {
            statusCode: 200,
            body: { message: "Génération du CSV en cours..." },
        };
    } catch (error) {
        console.error("Erreur lors de la vérification de l'export :", error);
        return {
            statusCode: 500,
            body: { error: "Erreur serveur" },
        };
    }
});

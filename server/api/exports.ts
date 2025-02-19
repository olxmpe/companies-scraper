import { defineEventHandler, readBody } from 'h3';
import Database from 'better-sqlite3';

const db = new Database('./emails.db');

export default defineEventHandler(async (event) => {
    const method = event.req.method;

    if (method === 'GET') {
        try {
            const exports = db.prepare('SELECT * FROM exports').all();
            return {
                statusCode: 200,
                body: exports,
            };
        } catch (error) {
            console.error("Erreur lors de la récupération des exports :", error);
            event.res.statusCode = 500;
            return {
                error: "Erreur serveur",
            };
        }
    } else {
        event.res.statusCode = 405;
        return {
            error: `Méthode ${method} non autorisée`,
        };
    }
});

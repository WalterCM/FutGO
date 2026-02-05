import { getRating } from '../lib/utils.js';

const scenarios = [
    {
        name: "Comienzo desde Cero (Todos iniciales)",
        maxElo: 1000,
        players: [1000, 1000, 1000]
    },
    {
        name: "Primeros Pasos (Pequeña ventaja)",
        maxElo: 1050,
        players: [1000, 1025, 1050]
    },
    {
        name: "Crecimiento Gradual (Hacia los 2000)",
        maxElo: 1500,
        players: [1000, 1250, 1500]
    },
    {
        name: "Alcanzando el Umbral de Excelencia",
        maxElo: 2000,
        players: [1000, 1500, 2000]
    },
    {
        name: "Superando el Umbral (Elite Global)",
        maxElo: 2500,
        players: [1000, 2000, 2500]
    },
    {
        name: "Nivel Dios (3000 ELO)",
        maxElo: 3000,
        players: [1000, 2000, 3000]
    }
];

console.log("=== SIMULACIÓN DE RATING FUTGO (0-99) ===\n");

scenarios.forEach(s => {
    console.log(`CASO: ${s.name}`);
    console.log(`Max ELO de la Comunidad: ${s.maxElo}`);
    console.log("------------------------------------------");
    s.players.forEach(elo => {
        const rating = getRating(elo, s.maxElo);
        console.log(`ELO: ${elo.toString().padEnd(4)} -> Rating: ${rating}`);
    });
    console.log("\n");
});

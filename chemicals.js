const readline = require('readline');

// Configurazione I/O standard
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

/**
 * Helper per input asincrono
 */
function askQuestion(query) {
    return new Promise(resolve => rl.question(query, resolve));
}

/**
 * Valida e parsifica un numero, ritorna null se non valido
 */
function parseNumber(input, defaultValue = null) {
    const trimmed = input.trim();
    if (trimmed === "" && defaultValue !== null) {
        return defaultValue;
    }
    const num = parseFloat(trimmed);
    return isNaN(num) ? null : num;
}

/**
 * Funzione specifica per CALCIO (Solido)
 * Assumiamo sia sempre in Kg dato che è solido/granulare
 */
async function getCalciumInput() {
    console.log("\n### 1. IPOCLORITO DI CALCIO (Solido) ###");

    let weight, price, conc;

    // Validazione input peso
    while (true) {
        const weightInput = await askQuestion("Peso confezione (kg): ");
        weight = parseNumber(weightInput);
        if (weight !== null && weight > 0) break;
        console.log("⚠️  Inserisci un valore numerico valido maggiore di 0");
    }

    // Validazione input prezzo
    while (true) {
        const priceInput = await askQuestion("Costo totale (€): ");
        price = parseNumber(priceInput);
        if (price !== null && price > 0) break;
        console.log("⚠️  Inserisci un valore numerico valido maggiore di 0");
    }

    // Validazione input concentrazione
    while (true) {
        const concInput = await askQuestion("Concentrazione cloro (%) [es. 65]: ");
        conc = parseNumber(concInput);
        if (conc !== null && conc > 0 && conc <= 100) break;
        console.log("⚠️  Inserisci un valore tra 0 e 100");
    }

    return {
        type: 'CALCIO',
        price: price,
        grossMass: weight,
        concentration: conc,
        unit: 'kg',
        traceMsg: '(Inserito direttamente in Kg)'
    };
}

/**
 * Funzione specifica per SODIO (Liquido)
 * Branching condizionale: Prima l'unità, poi le domande pertinenti.
 */
async function getSodiumInput() {
    console.log("\n### 2. IPOCLORITO DI SODIO (Liquido) ###");

    // STEP 1: DECISIONE UNITÀ
    let unit = '';
    while (unit !== 'l' && unit !== 'k') {
        const input = await askQuestion("L'unità di misura è Litri (L) o Chilogrammi (K)? [L/K]: ");
        unit = input.trim().toLowerCase().charAt(0);
        if (unit !== 'l' && unit !== 'k') {
            console.log("⚠️  Inserisci L per Litri o K per Chilogrammi");
        }
    }

    let grossMass = 0;
    let traceMsg = "";

    // STEP 2: BRANCHING
    if (unit === 'l') {
        // --- RAMO LITRI ---
        console.log(">> Hai selezionato LITRI. Servirà la densità.");

        let volume, density;

        // Validazione volume
        while (true) {
            const volInput = await askQuestion("Inserisci Volume (Litri): ");
            volume = parseNumber(volInput);
            if (volume !== null && volume > 0) break;
            console.log("⚠️  Inserisci un valore numerico valido maggiore di 0");
        }

        // Validazione densità (con default)
        while (true) {
            const densityInput = await askQuestion("Inserisci Densità (kg/L) [Invio per default 1.2]: ");
            density = parseNumber(densityInput, 1.2);
            if (density !== null && density > 0) break;
            console.log("⚠️  Inserisci un valore numerico valido maggiore di 0");
        }

        // Calcolo massa
        grossMass = volume * density;
        traceMsg = `(Calcolato da ${volume.toFixed(2)}L × densità ${density.toFixed(2)} kg/L)`;

    } else {
        // --- RAMO CHILOGRAMMI ---
        console.log(">> Hai selezionato KG. La densità viene ignorata.");

        while (true) {
            const weightInput = await askQuestion("Inserisci Peso (Kg): ");
            grossMass = parseNumber(weightInput);
            if (grossMass !== null && grossMass > 0) break;
            console.log("⚠️  Inserisci un valore numerico valido maggiore di 0");
        }

        traceMsg = `(Inserito direttamente in Kg)`;
    }

    // STEP 3: DATI COMUNI (Prezzo e Concentrazione)
    let price, conc;

    // Validazione prezzo
    while (true) {
        const priceInput = await askQuestion("Costo totale (€): ");
        price = parseNumber(priceInput);
        if (price !== null && price > 0) break;
        console.log("⚠️  Inserisci un valore numerico valido maggiore di 0");
    }

    // Validazione concentrazione
    while (true) {
        const concInput = await askQuestion("Concentrazione cloro (%) [es. 14 o 15]: ");
        conc = parseNumber(concInput);
        if (conc !== null && conc > 0 && conc <= 100) break;
        console.log("⚠️  Inserisci un valore tra 0 e 100");
    }

    return {
        type: 'SODIO',
        price: price,
        grossMass: grossMass,
        concentration: conc,
        unit: 'kg', // Tutti i calcoli sono normalizzati in kg
        traceMsg: traceMsg
    };
}

/**
 * Logica Pura: Calcola costo per kg di principio attivo
 */
function calculateMetrics(data) {
    if (isNaN(data.price) || isNaN(data.grossMass) || isNaN(data.concentration) || data.grossMass === 0) {
        throw new Error(`Dati non validi o incompleti per ${data.type}`);
    }

    // 1. Quantità netta di cloro
    const activeMass = data.grossMass * (data.concentration / 100);

    // 2. Prezzo per unità di cloro netto
    const pricePerActiveKg = data.price / activeMass;

    return {
        ...data,
        activeMass,
        pricePerActiveKg
    };
}

/**
 * Output dei calcoli (Tracing)
 */
function printTrace(metrics) {
    console.log(`\n--- ANALISI: ${metrics.type} ---`);
    // Mostra sempre il messaggio di tracciamento
    if (metrics.traceMsg) {
        console.log(`> Origine dati: ${metrics.traceMsg}`);
    }
    console.log(`> Massa Lorda Totale: ${metrics.grossMass.toFixed(2)} kg`);
    console.log(`> Concentrazione:     ${metrics.concentration}%`);
    console.log(`> Cloro Puro (Netto): ${metrics.grossMass.toFixed(2)} × ${(metrics.concentration / 100).toFixed(2)} = **${metrics.activeMass.toFixed(2)} kg**`);
    console.log(`> COSTO REALE:        **${metrics.pricePerActiveKg.toFixed(2)} €** per kg di cloro puro`);
}

async function main() {
    try {
        console.log("=== CONFRONTO PREZZI CLORO v4.1 (Fixed) ===");

        // Input
        const rawCa = await getCalciumInput();
        const rawNa = await getSodiumInput();

        // Calcolo
        const metricsCa = calculateMetrics(rawCa);
        const metricsNa = calculateMetrics(rawNa);

        // Visualizzazione Passaggi
        printTrace(metricsCa);
        printTrace(metricsNa);

        // Confronto
        console.log("\n================================================");
        console.log("               VERDETTO FINALE");
        console.log("================================================");

        if (metricsCa.pricePerActiveKg < metricsNa.pricePerActiveKg) {
            const diff = metricsNa.pricePerActiveKg - metricsCa.pricePerActiveKg;
            console.log(`🏆 CONVIENE: IPOCLORITO DI CALCIO (Solido)`);
            console.log(`   Risparmio: ${diff.toFixed(2)} € per ogni Kg di principio attivo.`);
        } else if (metricsNa.pricePerActiveKg < metricsCa.pricePerActiveKg) {
            const diff = metricsCa.pricePerActiveKg - metricsNa.pricePerActiveKg;
            console.log(`🏆 CONVIENE: IPOCLORITO DI SODIO (Liquido)`);
            console.log(`   Risparmio: ${diff.toFixed(2)} € per ogni Kg di principio attivo.`);
        } else {
            console.log("⚖️  PAREGGIO: I costi sono identici.");
        }
        console.log("================================================");

    } catch (err) {
        console.error(`\n❌ ERRORE: ${err.message}`);
    } finally {
        rl.close();
    }
}

main();
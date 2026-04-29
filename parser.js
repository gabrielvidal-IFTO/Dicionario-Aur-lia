const fs = require('fs');
window = {}; // Just in case
const raw = fs.readFileSync('Dicionário Aurélia.txt', 'utf8');

const lines = raw.split('\n');
let words = [];

for (let line of lines) {
    line = line.trim();
    if (!line || line.length === 1 || line === 'A' || line.startsWith('AURÉLIA') || line.startsWith('Este dicionário')) {
        continue;
    }
    const dashIndex = line.indexOf(' - ');
    if (dashIndex > -1) {
        const term = line.substring(0, dashIndex).trim();
        const def = line.substring(dashIndex + 3).trim();
        words.push({ word: term, definition: def });
    } else {
        // Some lines might not have ' - ', try fallback if needed.
    }
}

fs.writeFileSync('dicionario.json', JSON.stringify(words, null, 2));
console.log(`Parsed ${words.length} terms.`);

const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../hyoki_rule_table.csv');
const tsPath = path.join(__dirname, '../lib/defaultRules.ts');

const escapeString = (str) => {
    if (!str) return '';
    return str.replace(/'/g, "\\'").replace(/\n/g, '\\n').replace(/\r/g, '');
};

try {
    const csvContent = fs.readFileSync(csvPath, 'utf-8');
    const lines = csvContent.split('\n');
    const rules = [];

    // Skip header (0th line)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        // rudimentary CSV parser assuming no commas inside the values (since the file is simple)
        // Since there is a comma in text? Let's check: "NG表記,OK表記,備考" (Some notes might have commas, but let's assume standard split works or we can handle quotes)
        // Let's use a simple regex to handle CSV correctly if there are quotes
        const regex = /(?:^|,)(\"(?:[^\"]+|\"\")*\"|[^,]*)/g;
        let p;
        const parts = [];
        while ((p = regex.exec(line)) !== null) {
            let val = p[1];
            if (val.startsWith('"') && val.endsWith('"')) {
                val = val.slice(1, -1).replace(/""/g, '"');
            }
            parts.push(val);
        }

        if (parts.length >= 2) {
            const incorrect = parts[0].trim();
            const correct = parts[1].trim();
            const note = parts[2] ? parts[2].trim() : '';
            
            if (incorrect && correct) {
                rules.push({ incorrect, correct, note });
            }
        }
    }

    let tsContent = 'export const defaultInconsistencyRules = [\n';
    rules.forEach(r => {
        tsContent += `    { incorrect: '${escapeString(r.incorrect)}', correct: '${escapeString(r.correct)}', note: '${escapeString(r.note)}' },\n`;
    });
    tsContent += '];\n';

    fs.writeFileSync(tsPath, tsContent, 'utf-8');
    console.log(`Generated lib/defaultRules.ts with ${rules.length} rules.`);
} catch (error) {
    console.error('Failed to generate rules:', error);
}

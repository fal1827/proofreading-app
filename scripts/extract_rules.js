// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require('xlsx');
const workbook = XLSX.readFile('rules.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);

console.log('--- RULES START ---');
data.forEach(row => {
    // Find keys that contain 'NG' or 'OK'
    const keys = Object.keys(row);
    const ngKey = keys.find(k => k.includes('NG'));
    const okKey = keys.find(k => k.includes('OK'));

    if (ngKey && okKey) {
        console.log(`NG: ${row[ngKey]}, OK: ${row[okKey]}`);
    }
});
console.log('--- RULES END ---');

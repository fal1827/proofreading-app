// eslint-disable-next-line @typescript-eslint/no-require-imports
const XLSX = require('xlsx');
const workbook = XLSX.readFile('rules.xlsx');
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = XLSX.utils.sheet_to_json(sheet);
if (data.length > 0) {
    console.log('Keys:', Object.keys(data[0]));
    console.log('First Row:', data[0]);
} else {
    console.log('No data found');
}

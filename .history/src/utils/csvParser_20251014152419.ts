export type CsvRow = { [header: string]: string };

/**
 * parseCsv
 * - Accepts CSV text
 * - Handles quoted fields, escaped double-quotes ("") and newlines inside quoted fields
 * - Trims BOM and surrounding whitespace but DO NOT change header names
 * - Returns array of objects using header row exactly as keys
 */
export function parseCsv(csvText: string): CsvRow[] {
	// remove UTF-8 BOM if present
	if (csvText.startsWith('\uFEFF')) csvText = csvText.slice(1);

	const rows: string[][] = [];
	let cur: string[] = [''];
	let inQuotes = false;
	let i = 0;

	while (i < csvText.length) {
		const ch = csvText[i];

		if (inQuotes) {
			if (ch === '"') {
				// lookahead for escaped quote
				if (i + 1 < csvText.length && csvText[i + 1] === '"') {
					cur[cur.length - 1] += '"';
					i += 2;
					continue;
				} else {
					inQuotes = false;
					i++;
					continue;
				}
			} else {
				cur[cur.length - 1] += ch;
				i++;
				continue;
			}
		} else {
			if (ch === '"') {
				inQuotes = true;
				i++;
				continue;
			}
			if (ch === ',') {
				cur.push('');
				i++;
				continue;
			}
			// handle CRLF or LF as row terminator
			if (ch === '\r') {
				// look for \r\n
				if (i + 1 < csvText.length && csvText[i + 1] === '\n') i++;
				rows.push(cur);
				cur = [''];
				i++;
				continue;
			}
			if (ch === '\n') {
				rows.push(cur);
				cur = [''];
				i++;
				continue;
			}
			// regular character
			cur[cur.length - 1] += ch;
			i++;
			continue;
		}
	}
	// push last row if not empty or if file ended with separator
	// A row is considered if there is any non-empty or even empty row (to keep alignment)
	if (!(cur.length === 1 && cur[0] === '')) {
		rows.push(cur);
	}

	if (rows.length === 0) return [];

	// Trim whitespace from headers and values but preserve header exact text except leading/trailing spaces
	const rawHeaders = rows[0].map(h => h /* keep exact header content as-is except trim BOM spaces */.trim());
	const headers = rawHeaders; // keep header names (Vietnamese) exactly as keys
	const result: CsvRow[] = [];

	for (let r = 1; r < rows.length; r++) {
		const row = rows[r];
		// if row length < headers, pad; if longer, keep extras by index
		const obj: CsvRow = {};
		for (let c = 0; c < headers.length; c++) {
			const header = headers[c];
			const val = c < row.length ? row[c] : '';
			obj[header] = val.trim();
		}
		// ignore completely empty rows
		const anyNonEmpty = Object.values(obj).some(v => v !== '');
		if (anyNonEmpty) result.push(obj);
	}
	return result;
}

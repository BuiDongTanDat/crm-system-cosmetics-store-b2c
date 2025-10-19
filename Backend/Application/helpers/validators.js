function asString(v, def = '') {
    return typeof v === 'string' ? v.trim() : (v != null ? String(v).trim() : def);
}
function asStringArray(v, def = []) {
    if (!v) return def;
    if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
    if (typeof v === 'string') {
        return v
            .split(/[;,]/)
            .map((x) => x.trim())
            .filter(Boolean);
    }
    return def;
}

function asNumber(v, def = 0) {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? def : n;
}

function asFloat(v, def = 0) {
    const f = parseFloat(v);
    return Number.isNaN(f) ? def : f;
}

function asDate(v) {
    if (!v) return null;
    const d = new Date(v);
    return isNaN(d.getTime()) ? null : d;
}

function stripNullish(obj = {}) {
    return Object.fromEntries(
        Object.entries(obj).filter(([_, v]) => v !== null && v !== undefined && v !== '')
    );
}

module.exports = { asStringArray, asString, asNumber, asFloat, asDate, stripNullish };
// snsjsonst asyncHandler = require('../../Infrastructure/Utils/asyncHandler');
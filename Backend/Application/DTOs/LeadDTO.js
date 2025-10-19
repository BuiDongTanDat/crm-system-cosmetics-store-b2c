const { asStringArray, asString, asNumber, asFloat, asDate, stripNullish } = require('../helpers/validators');
class CreateRequestLeadDTO {
    constructor(req = {}) {
        this.id = req.id || null;
        this.name = req.name || '';
        this.email = req.email || '';
        this.phone = req.phone || '';
        this.status = req.status || 'new';
        this.source = req.source || 'InBound';
        this.campaign_id = req.campaign_id || null;
        this.tags = Array.isArray(req.tags) ? req.tags : [];
        this.assigned_to = req.assigned_to || null;
    }
    static from(body = {}) {
        return new CreateRequestLeadDTO(body);
    }
}
class ImportLeadFromCSVDTO {
    constructor(row = {}) {
        this.customer_id = asString(row.CustomerID);
        this.name = asString(row.FullName);
        this.phone = asString(row.Phone);
        this.email = asString(row.Email);
        this.source = asString(row.Source || row.source) || 'Inbound';
        this.status = asString(row.Status) || 'New';
        this.lead_score = asNumber(row.LeadScore, 0);
        this.conversion_rate = asFloat(row.ConversionRate, 0);
        this.assigned_to = asString(row.AssignedTo || row.assigned_to);
        this.created_at = asDate(row.CreatedAt);
        this.tags = asStringArray(row.Tags || row.tags || 'Quang Cao san pham thang 10'); // <-- thêm tags, parse từ chuỗi CSV
    }

    static fromCSVRow(row = {}) {
        return new ImportLeadFromCSVDTO(stripNullish(row));
    }

    static fromCSVArray(rows = []) {
        return Array.isArray(rows) ? rows.map((r) => ImportLeadFromCSVDTO.fromCSVRow(r)) : [];
    }
}
module.exports = { CreateRequestLeadDTO, ImportLeadFromCSVDTO };
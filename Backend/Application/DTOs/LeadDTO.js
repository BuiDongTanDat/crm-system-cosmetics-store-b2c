class CreateLeadRequestDTO {
  constructor({ customerId, source, assignedTo }) {
    this.customerId = customerId;
    this.source = source;
    this.assignedTo = assignedTo;
  }
}

class UpdateLeadStatusRequestDTO {
  constructor({ status, leadScore, conversionProb }) {
    this.status = status;
    this.leadScore = leadScore;
    this.conversionProb = conversionProb;
  }
}

class LeadResponseDTO {
  constructor(lead) {
    this.id = lead.lead_id;
    this.customerId = lead.customer_id;
    this.status = lead.status;
    this.source = lead.source;
    this.leadScore = lead.lead_score;
    this.conversionProb = lead.conversion_prob;
    this.assignedTo = lead.assigned_to;
    this.createdAt = lead.created_at;
  }
}

module.exports = { CreateLeadRequestDTO, UpdateLeadStatusRequestDTO, LeadResponseDTO };

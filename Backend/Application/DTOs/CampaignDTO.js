class CreateCampaignRequestDTO {
  constructor({ name, channel, budget, startDate, endDate, targetFilter, ownerEmployeeId }) {
    this.name = name;
    this.channel = channel;
    this.budget = budget;
    this.startDate = startDate;
    this.endDate = endDate;
    this.targetFilter = targetFilter;
    this.ownerEmployeeId = ownerEmployeeId;
  }
}

class UpdateCampaignStatusRequestDTO {
  constructor({ status }) {
    this.status = status;
  }
}

class CampaignResponseDTO {
  constructor(campaign) {
    this.id = campaign.campaign_id;
    this.name = campaign.name;
    this.channel = campaign.channel;
    this.budget = campaign.budget;
    this.status = campaign.status;
    this.startDate = campaign.start_date;
    this.endDate = campaign.end_date;
  }
}

module.exports = { CreateCampaignRequestDTO, UpdateCampaignStatusRequestDTO, CampaignResponseDTO };

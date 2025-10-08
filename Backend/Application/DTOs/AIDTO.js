// =================== REQUEST DTO ===================
class AnalyzeTextRequestDTO {
  constructor({ text }) {
    this.text = text;
  }
}

class RecommendProductRequestDTO {
  constructor({ customerId }) {
    this.customerId = customerId;
  }
}

// =================== RESPONSE DTO ===================
class AIResponseDTO {
  constructor({ success, type, data, message }) {
    this.success = success;
    this.type = type;
    this.data = data;
    this.message = message;
  }
}

module.exports = {
  AnalyzeTextRequestDTO,
  RecommendProductRequestDTO,
  AIResponseDTO,
};

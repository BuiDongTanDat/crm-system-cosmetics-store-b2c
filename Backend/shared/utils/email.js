module.exports = {
  async sendEmail(to, subject, text) {
    console.log(`[EmailService] To: ${to}\nSubject: ${subject}\n${text}`);
  }
};

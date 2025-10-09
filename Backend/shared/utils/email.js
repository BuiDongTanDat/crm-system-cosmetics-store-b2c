module.exports = {
  async sendEmail(to, subject, text) {
    console.log(`[EmailService] To: ${to}\nSubject: ${subject}\n${text}`);
    // sau này bạn có thể thay bằng Nodemailer hoặc AWS SES
  }
};

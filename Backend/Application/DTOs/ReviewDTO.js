class ReviewDTO {
  constructor({ reviewer, rating, comment, date }) {
    this.reviewer = reviewer;
    this.rating = rating;
    this.comment = comment;
    this.date = date;
  }
}

module.exports = ReviewDTO;

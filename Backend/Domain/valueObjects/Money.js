class Money {
  constructor(amount, currency = "VND") {
    if (amount < 0) throw new Error("Amount cannot be negative");
    this.amount = amount;
    this.currency = currency;
  }

  add(value) {
    this.amount += value.amount;
  }

  subtract(value) {
    this.amount -= value.amount;
  }
}

module.exports = Money;

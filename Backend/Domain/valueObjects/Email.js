class Email {
  constructor(value) {
    if (!/\S+@\S+\.\S+/.test(value)) {
      throw new Error("Invalid email format");
    }
    this.value = value.toLowerCase();
  }

  equals(other) {
    return this.value === other.value;
  }
}

module.exports = Email;

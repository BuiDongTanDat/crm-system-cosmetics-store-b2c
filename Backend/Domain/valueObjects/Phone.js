
class Phone {
  constructor(value) {
    if (!value || typeof value !== 'string') {
      throw new Error('Phone must be a non-empty string.');
    }

    // Normalize & validate
    const digits = value.replace(/[^\d+]/g, '');
    const phoneRegex = /^\+?\d{8,15}$/; // hỗ trợ định dạng quốc tế
    if (!phoneRegex.test(digits)) {
      throw new Error(`Invalid phone number: ${value}`);
    }

    this._value = digits;
    Object.freeze(this);
  }

  get value() {
    return this._value;
  }

  equals(other) {
    return other instanceof Phone && this._value === other._value;
  }

  toString() {
    return this._value;
  }

  toJSON() {
    return this._value;
  }
}

module.exports = Phone;

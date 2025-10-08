// Backend/src/Domain/valueObjects/DateRange.js

class DateRange {
  constructor(start, end) {
    if (!start || !end) throw new Error('DateRange requires start and end.');
    const startDate = new Date(start);
    const endDate = new Date(end);

    if (isNaN(startDate) || isNaN(endDate)) {
      throw new Error('Invalid date format for DateRange.');
    }
    if (startDate > endDate) {
      throw new Error('Start date cannot be after end date.');
    }

    this._start = startDate;
    this._end = endDate;
    Object.freeze(this);
  }

  get start() {
    return this._start;
  }

  get end() {
    return this._end;
  }

  contains(date) {
    const d = new Date(date);
    return d >= this._start && d <= this._end;
  }

  overlaps(other) {
    if (!(other instanceof DateRange)) {
      throw new Error('Can only compare with another DateRange.');
    }
    return this._start <= other.end && this._end >= other.start;
  }

  equals(other) {
    return (
      other instanceof DateRange &&
      this._start.getTime() === other._start.getTime() &&
      this._end.getTime() === other._end.getTime()
    );
  }

  toString() {
    return `${this._start.toISOString()} → ${this._end.toISOString()}`;
  }

  toJSON() {
    return { start: this._start.toISOString(), end: this._end.toISOString() };
  }
}

module.exports = DateRange;

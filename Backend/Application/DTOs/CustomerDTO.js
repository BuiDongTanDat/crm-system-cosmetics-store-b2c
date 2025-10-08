class CreateCustomerRequestDTO {
  constructor({ fullName, customerType, birthDate, gender, email, phone, address, source, tags, notes }) {
    this.fullName = fullName;
    this.customerType = customerType;
    this.birthDate = birthDate;
    this.gender = gender;
    this.email = email;
    this.phone = phone;
    this.address = address;
    this.source = source;
    this.tags = tags;
    this.notes = notes;
  }
}

class UpdateCustomerRequestDTO {
  constructor({ fullName, customerType, address, tags, notes }) {
    this.fullName = fullName;
    this.customerType = customerType;
    this.address = address;
    this.tags = tags;
    this.notes = notes;
  }
}

class CustomerResponseDTO {
  constructor(customer) {
    this.id = customer.customer_id;
    this.fullName = customer.full_name;
    this.type = customer.customer_type;
    this.email = customer.email;
    this.phone = customer.phone;
    this.gender = customer.gender;
    this.address = customer.address;
    this.tags = customer.tags;
    this.source = customer.source;
    this.createdAt = customer.created_at;
  }
}

module.exports = { CreateCustomerRequestDTO, UpdateCustomerRequestDTO, CustomerResponseDTO };

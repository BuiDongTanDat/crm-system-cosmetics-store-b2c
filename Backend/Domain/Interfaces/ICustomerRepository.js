// /**
//  * Interface CustomerRepository
//  * Định nghĩa các phương thức mà repository phải implement
//  */

// class ICustomerRepository {
//   /**
//    * Tạo khách hàng mới
//    * @param {Customer} customer
//    * @returns {Promise<Customer>}
//    */
//   async create(customer) {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Cập nhật khách hàng hiện tại
//    * @param {Customer} customer
//    * @returns {Promise<Customer>}
//    */
//   async update(customer) {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Lấy khách hàng theo ID
//    * @param {string} customerId
//    * @returns {Promise<Customer|null>}
//    */
//   async findById(customerId) {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Lấy tất cả khách hàng
//    * @returns {Promise<Customer[]>}
//    */
//   async findAll() {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Xóa khách hàng theo ID
//    * @param {string} customerId
//    */
//   async delete(customerId) {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Tìm khách hàng theo email
//    * @param {string} email
//    * @returns {Promise<Customer|null>}
//    */
//   async findByEmail(email) {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Tìm khách hàng theo phone
//    * @param {string} phone
//    * @returns {Promise<Customer|null>}
//    */
//   async findByPhone(phone) {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Tìm khách hàng theo tag
//    * @param {string} tag
//    * @returns {Promise<Customer[]>}
//    */
//   async findByTag(tag) {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Tìm khách hàng theo nguồn (source)
//    * @param {string} source
//    * @returns {Promise<Customer[]>}
//    */
//   async findBySource(source) {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Nghiệp vụ tiện ích: thêm tag, xóa tag, thêm/xóa social channel
//    * Có thể thêm các phương thức abstract nếu muốn enforce
//    */
// }

// module.exports = ICustomerRepository;

// /**
//  * Interface LeadRepository
//  * Định nghĩa các phương thức mà repository phải implement
//  */

// /**
//  * @typedef {'New'|'Contacted'|'Nurturing'|'Qualified'|'Converted'|'Lost'} LeadStage
//  */

// /**
//  * @typedef {Object} Lead
//  * @property {string=} lead_id
//  * @property {number=} customer_id
//  * @property {string=} full_name
//  * @property {string=} phone
//  * @property {string=} email
//  * @property {string}  lead_source          // InBound / OutBound
//  * @property {string=} source_detail        // Website / TikTok / Social / ...
//  * @property {LeadStage} status
//  * @property {number} lead_score            // 0..100
//  * @property {number} conversion_prob       // 0..1
//  * @property {string=} assigned_to
//  * @property {string=} flow_id
//  * @property {string=} trigger_type
//  * @property {Date|string=} trigger_at
//  * @property {string=} notes
//  * @property {Date|string=} created_at
//  * @property {Date|string=} updated_at
//  */

// /**
//  * @typedef {Object} LeadListFilters
//  * @property {LeadStage=} status
//  * @property {string=} lead_source
//  * @property {string=} source_detail
//  * @property {string=} assigned_to
//  * @property {string=} q                    // tìm nhanh theo tên/email/phone/notes
//  */

// /**
//  * @template T
//  * @typedef {Object} Paginated
//  * @property {T[]} data
//  * @property {number} page
//  * @property {number} pageSize
//  * @property {number} total
//  * @property {number} totalPages
//  */

// class ILeadRepository {
//   /**
//    * Lấy lead theo ID
//    * @param {string} leadId
//    * @returns {Promise<Lead|null>}
//    */
//   async findById(leadId) {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Lấy tất cả lead
//    * @returns {Promise<Lead[]>}
//    */
//   async findAll() {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Tạo mới hoặc cập nhật lead
//    * @param {Lead|import('sequelize').Model} lead
//    * @returns {Promise<Lead>}
//    */
//   async save(lead) {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Xóa lead theo ID
//    * @param {string} leadId
//    * @returns {Promise<void>}
//    */
//   async delete(leadId) {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Tìm lead theo trạng thái
//    * @param {LeadStage} status
//    * @returns {Promise<Lead[]>}
//    */
//   async findByStatus(status) {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Tìm lead theo nguồn/kênh
//    * @param {string} lead_source
//    * @param {string=} source_detail
//    * @returns {Promise<Lead[]>}
//    */
//   async findBySource(lead_source, source_detail) {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Tìm nhanh theo tên/email/phone/notes
//    * @param {string} q
//    * @param {number=} limit
//    * @returns {Promise<Lead[]>}
//    */
//   async search(q, limit) {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Cập nhật trạng thái lead
//    * @param {string} leadId
//    * @param {LeadStage} newStatus
//    * @returns {Promise<Lead|null>}
//    */
//   async updateStatus(leadId, newStatus) {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Gán owner/phụ trách cho lead
//    * @param {string} leadId
//    * @param {string} owner
//    * @returns {Promise<Lead|null>}
//    */
//   async assignOwner(leadId, owner) {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Cập nhật flow/trigger hiện hành
//    * @param {string} leadId
//    * @param {{flow_id?: string|null, trigger_type?: string|null, trigger_at?: Date|string|null}} patch
//    * @returns {Promise<Lead|null>}
//    */
//   async updateFlow(leadId, patch) {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Lấy lead "nóng" theo điểm
//    * @param {number=} minScore
//    * @param {number=} limit
//    * @returns {Promise<Lead[]>}
//    */
//   async findHot(minScore, limit) {
//     throw new Error('Method not implemented');
//   }

//   /**
//    * Phân trang lead
//    * @param {{page?: number, pageSize?: number, filters?: LeadListFilters}=} args
//    * @returns {Promise<Paginated<Lead>>}
//    */
//   async paginate(args) {
//     throw new Error('Method not implemented');
//   }
// }

// module.exports = ILeadRepository;

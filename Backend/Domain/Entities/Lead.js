// // backend/src/Domain/Entities/Lead.ts
// import {
//   DataTypes,
//   Model,
//   Optional,
//   Sequelize,
//   InferAttributes,
//   InferCreationAttributes,
//   CreationOptional,
// } from 'sequelize';

// export type LeadStatus =
//   | 'New'
//   | 'Contacted'
//   | 'Nurturing'
//   | 'Qualified'
//   | 'Converted'
//   | 'Lost';

// export interface LeadAttributes {
//   lead_id: string;
//   customer_id: string | null;        // BIGINT trong PG -> nên để string để an toàn
//   full_name: string | null;
//   phone: string | null;
//   email: string | null;

//   lead_source: string;               // ví dụ: InBound / OutBound
//   source_detail: string | null;      // Website/TikTok/Social/Referral/...

//   status: LeadStatus;                // ENUM
//   lead_score: number;                // 0..100
//   conversion_prob: string;           // DECIMAL(5,4) -> Sequelize trả string

//   flow_id: string | null;            // liên kết flow nếu có
//   trigger_type: string | null;       // CART_ABANDON / CHECKOUT_RECOVERY / ...
//   trigger_at: Date | null;

//   notes: string | null;

//   created_at: Date;                  // timestamps + underscored
//   updated_at: Date;
// }

// export type LeadCreationAttributes = Optional<
//   LeadAttributes,
//   | 'lead_id'
//   | 'customer_id'
//   | 'full_name'
//   | 'phone'
//   | 'email'
//   | 'source_detail'
//   | 'status'
//   | 'lead_score'
//   | 'conversion_prob'
//   | 'flow_id'
//   | 'trigger_type'
//   | 'trigger_at'
//   | 'notes'
//   | 'created_at'
//   | 'updated_at'
// >;

// export class Lead
//   extends Model<InferAttributes<Lead>, InferCreationAttributes<Lead>>
//   implements LeadAttributes
// {
//   declare lead_id: CreationOptional<string>;
//   declare customer_id: string | null;

//   declare full_name: string | null;
//   declare phone: string | null;
//   declare email: string | null;

//   declare lead_source: string;
//   declare source_detail: string | null;

//   declare status: LeadStatus;
//   declare lead_score: number;
//   declare conversion_prob: string;

//   declare flow_id: string | null;
//   declare trigger_type: string | null;
//   declare trigger_at: Date | null;

//   declare notes: string | null;

//   declare created_at: CreationOptional<Date>;
//   declare updated_at: CreationOptional<Date>;

//   /** Đổi stage (pipeline) và cập nhật updated_at qua timestamps */
//   updateStatus(newStatus: LeadStatus): void {
//     this.status = newStatus;
//     this.updated_at = new Date();
//   }

//   /** Gán flow/trigger hiện hành cho lead */
//   setFlow(opts: { flow_id?: string | null; trigger_type?: string | null; trigger_at?: Date | null } = {}): void {
//     const { flow_id, trigger_type, trigger_at } = opts;
//     if (flow_id !== undefined) this.flow_id = flow_id;
//     if (trigger_type !== undefined) this.trigger_type = trigger_type;
//     if (trigger_at !== undefined) this.trigger_at = trigger_at;
//     this.updated_at = new Date();
//   }

//   static initModel(sequelize: Sequelize): typeof Lead {
//     Lead.init(
//       {
//         lead_id: {
//           type: DataTypes.UUID,
//           defaultValue: DataTypes.UUIDV4,
//           primaryKey: true,
//         },

//         // BIGINT nên map string cho an toàn
//         customer_id: { type: DataTypes.BIGINT, allowNull: true },

//         full_name: { type: DataTypes.STRING, allowNull: true },
//         phone: { type: DataTypes.STRING, allowNull: true },
//         email: { type: DataTypes.STRING, allowNull: true },

//         lead_source: { type: DataTypes.STRING, allowNull: false },
//         source_detail: { type: DataTypes.STRING, allowNull: true },

//         status: {
//           type: DataTypes.ENUM('New', 'Contacted', 'Nurturing', 'Qualified', 'Converted', 'Lost'),
//           allowNull: false,
//           defaultValue: 'New',
//         },
//         lead_score: {
//           type: DataTypes.INTEGER,
//           allowNull: false,
//           defaultValue: 0,
//           validate: { min: 0, max: 100 },
//         },
//         // PG DECIMAL -> string
//         conversion_prob: {
//           type: DataTypes.DECIMAL(5, 4),
//           allowNull: false,
//           defaultValue: 0.0,
//         },

//         flow_id: { type: DataTypes.STRING, allowNull: true },
//         trigger_type: { type: DataTypes.STRING, allowNull: true },
//         trigger_at: { type: DataTypes.DATE, allowNull: true },

//         notes: { type: DataTypes.TEXT, allowNull: true },

//         // thêm timestamps để khớp typing khi timestamps: true
//         created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
//         updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
//       },
//       {
//         sequelize,
//         modelName: 'Lead',
//         tableName: 'leads',
//         timestamps: true,
//         underscored: true,
//         indexes: [
//           { fields: ['status'] },
//           { fields: ['lead_source', 'source_detail'] },
//           { fields: ['trigger_at'] },
//         ],
//       }
//     );
//     return Lead;
//   }
// }

// export default Lead;

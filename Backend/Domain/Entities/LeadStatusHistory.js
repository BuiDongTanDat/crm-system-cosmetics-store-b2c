// // backend/src/Domain/Entities/LeadStatusHistory.ts
// import {
//   DataTypes,
//   Model,
//   Optional,
//   Sequelize,
//   InferAttributes,
//   InferCreationAttributes,
//   CreationOptional,
// } from 'sequelize';

// export type JsonMap = Record<string, any>;

// export interface LeadStatusHistoryAttributes {
//   id: string;               // BIGINT in Postgres -> map string for safety
//   lead_id: string;          // UUID
//   from_status: string | null;
//   to_status: string;        // required
//   reason: string | null;
//   changed_by: string | null;
//   changed_at: Date;         // default NOW
//   meta: JsonMap;            // JSONB
// }

// export type LeadStatusHistoryCreationAttributes = Optional<
//   LeadStatusHistoryAttributes,
//   | 'id'
//   | 'from_status'
//   | 'reason'
//   | 'changed_by'
//   | 'changed_at'
//   | 'meta'
// >;

// export class LeadStatusHistory
//   extends Model<
//     InferAttributes<LeadStatusHistory>,
//     InferCreationAttributes<LeadStatusHistory>
//   >
//   implements LeadStatusHistoryAttributes
// {
//   declare id: CreationOptional<string>;
//   declare lead_id: string;
//   declare from_status: string | null;
//   declare to_status: string;
//   declare reason: string | null;
//   declare changed_by: string | null;
//   declare changed_at: CreationOptional<Date>;
//   declare meta: JsonMap;

//   static initModel(sequelize: Sequelize): typeof LeadStatusHistory {
//     LeadStatusHistory.init(
//       {
//         id: {
//           type: DataTypes.BIGINT,       // PG BIGINT -> string in JS typings
//           primaryKey: true,
//           autoIncrement: true,
//         },
//         lead_id: { type: DataTypes.UUID, allowNull: false },
//         from_status: { type: DataTypes.STRING, allowNull: true },
//         to_status: { type: DataTypes.STRING, allowNull: false },
//         reason: { type: DataTypes.TEXT, allowNull: true },
//         changed_by: { type: DataTypes.STRING, allowNull: true },
//         changed_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
//         meta: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
//       },
//       {
//         sequelize,
//         modelName: 'LeadStatusHistory',
//         tableName: 'lead_status_history',
//         timestamps: false,
//         underscored: true,
//         indexes: [
//           { fields: ['lead_id'] },
//           { fields: ['changed_at'] },
//         ],
//       }
//     );
//     return LeadStatusHistory;
//   }
// }

// export default LeadStatusHistory;

// // backend/src/Domain/Entities/LeadInteraction.ts
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

// export interface LeadInteractionAttributes {
//   interaction_id: string;      // BIGINT trong PG -> map string để an toàn
//   lead_id: string;             // UUID
//   type: string;                // email_open | email_click | page_view | add_to_cart | ...
//   channel: string | null;      // optional
//   occurred_at: Date;           // default NOW
//   properties: JsonMap;         // JSONB
//   score_delta: number;         // default 0
//   created_by: string | null;   // optional
//   created_at: Date;            // default NOW
// }

// export type LeadInteractionCreationAttributes = Optional<
//   LeadInteractionAttributes,
//   | 'interaction_id'
//   | 'channel'
//   | 'occurred_at'
//   | 'properties'
//   | 'score_delta'
//   | 'created_by'
//   | 'created_at'
// >;

// export class LeadInteraction
//   extends Model<
//     InferAttributes<LeadInteraction>,
//     InferCreationAttributes<LeadInteraction>
//   >
//   implements LeadInteractionAttributes
// {
//   declare interaction_id: CreationOptional<string>;
//   declare lead_id: string;
//   declare type: string;
//   declare channel: string | null;
//   declare occurred_at: CreationOptional<Date>;
//   declare properties: JsonMap;
//   declare score_delta: number;
//   declare created_by: string | null;
//   declare created_at: CreationOptional<Date>;

//   static initModel(sequelize: Sequelize): typeof LeadInteraction {
//     LeadInteraction.init(
//       {
//         interaction_id: {
//           type: DataTypes.BIGINT,       // PG trả bigint dạng string
//           autoIncrement: true,
//           primaryKey: true,
//         },
//         lead_id: { type: DataTypes.UUID, allowNull: false },
//         type: { type: DataTypes.STRING, allowNull: false },
//         channel: { type: DataTypes.STRING, allowNull: true },
//         occurred_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
//         properties: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
//         score_delta: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
//         created_by: { type: DataTypes.STRING, allowNull: true },
//         created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
//       },
//       {
//         sequelize,
//         modelName: 'LeadInteraction',
//         tableName: 'lead_interactions',
//         timestamps: false,
//         underscored: true,
//         indexes: [
//           { fields: ['lead_id', 'occurred_at'] },
//           { fields: ['type'] },
//         ],
//       }
//     );
//     return LeadInteraction;
//   }
// }

// export default LeadInteraction;

// // backend/src/Domain/Entities/Interaction.ts
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

// export interface InteractionAttributes {
//   interaction_id: string;
//   customer_id: string | null;
//   lead_id: string | null;
//   type: string;            // vd: 'call' | 'chat' | 'email' | ...
//   channel: string;         // vd: 'zalo' | 'facebook' | 'email' | ...
//   content: string | null;  // nội dung tóm tắt
//   transcript: JsonMap;     // transcript chi tiết (JSON)
//   employee_id: string | null;
//   sentiment_score: number; // mặc định: 0
//   source_system: string | null;
//   created_at: Date;
// }

// export type InteractionCreationAttributes = Optional<
//   InteractionAttributes,
//   | 'interaction_id'
//   | 'customer_id'
//   | 'lead_id'
//   | 'content'
//   | 'transcript'
//   | 'employee_id'
//   | 'sentiment_score'
//   | 'source_system'
//   | 'created_at'
// >;

// export class Interaction
//   extends Model<InferAttributes<Interaction>, InferCreationAttributes<Interaction>>
//   implements InteractionAttributes
// {
//   declare interaction_id: CreationOptional<string>;
//   declare customer_id: string | null;
//   declare lead_id: string | null;
//   declare type: string;
//   declare channel: string;
//   declare content: string | null;
//   declare transcript: JsonMap;
//   declare employee_id: string | null;
//   declare sentiment_score: number;
//   declare source_system: string | null;
//   declare created_at: CreationOptional<Date>;

//   // ---- domain helpers (tuỳ chọn) ----
//   setSentiment(score: number): void {
//     this.sentiment_score = Number.isFinite(score) ? score : 0;
//   }

//   appendTranscript(patch: JsonMap): void {
//     this.transcript = { ...(this.transcript || {}), ...(patch || {}) };
//   }

//   toJSON(): InteractionAttributes {
//     return {
//       interaction_id: this.interaction_id,
//       customer_id: this.customer_id,
//       lead_id: this.lead_id,
//       type: this.type,
//       channel: this.channel,
//       content: this.content,
//       transcript: this.transcript,
//       employee_id: this.employee_id,
//       sentiment_score: this.sentiment_score,
//       source_system: this.source_system,
//       created_at: this.created_at,
//     };
//   }

//   // ---- Sequelize init ----
//   static initModel(sequelize: Sequelize): typeof Interaction {
//     Interaction.init(
//       {
//         interaction_id: {
//           type: DataTypes.UUID,
//           defaultValue: DataTypes.UUIDV4,
//           primaryKey: true,
//         },
//         customer_id: { type: DataTypes.UUID, allowNull: true },
//         lead_id: { type: DataTypes.UUID, allowNull: true },
//         type: { type: DataTypes.STRING, allowNull: false },
//         channel: { type: DataTypes.STRING, allowNull: false },
//         content: { type: DataTypes.TEXT, allowNull: true },
//         transcript: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
//         employee_id: { type: DataTypes.UUID, allowNull: true },
//         sentiment_score: { type: DataTypes.FLOAT, allowNull: false, defaultValue: 0 },
//         source_system: { type: DataTypes.STRING, allowNull: true },
//         created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
//       },
//       {
//         sequelize,
//         tableName: 'interactions',
//         modelName: 'Interaction',
//         timestamps: false,     // bạn đang lưu created_at thủ công
//         underscored: true,
//         indexes: [
//           { fields: ['customer_id'] },
//           { fields: ['lead_id'] },
//           { fields: ['type', 'channel'] },
//         ],
//       }
//     );
//     return Interaction;
//   }
// }

// export default Interaction;

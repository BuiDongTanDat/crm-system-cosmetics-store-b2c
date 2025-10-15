// // backend/src/Domain/Entities/Customer.ts
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

// export interface CustomerAttributes {
//   customer_id: string;
//   full_name: string;
//   customer_type: string | null;
//   birth_date: Date | null;
//   gender: string | null;
//   email: string | null;
//   phone: string | null;
//   address: string | null;
//   social_channels: JsonMap;     // luôn có object (default {})
//   source: string | null;
//   tags: string[];               // luôn có mảng (default [])
//   notes: string | null;
//   created_at: Date;             // timestamps: true + underscored
//   updated_at: Date;
// }

// export type CustomerCreationAttributes = Optional<
//   CustomerAttributes,
//   | 'customer_id'
//   | 'customer_type'
//   | 'birth_date'
//   | 'gender'
//   | 'email'
//   | 'phone'
//   | 'address'
//   | 'social_channels'
//   | 'source'
//   | 'tags'
//   | 'notes'
//   | 'created_at'
//   | 'updated_at'
// >;

// export class Customer
//   extends Model<InferAttributes<Customer>, InferCreationAttributes<Customer>>
//   implements CustomerAttributes
// {
//   declare customer_id: CreationOptional<string>;
//   declare full_name: string;
//   declare customer_type: string | null;
//   declare birth_date: Date | null;
//   declare gender: string | null;
//   declare email: string | null;
//   declare phone: string | null;
//   declare address: string | null;
//   declare social_channels: JsonMap;
//   declare source: string | null;
//   declare tags: string[];
//   declare notes: string | null;

//   declare created_at: CreationOptional<Date>;
//   declare updated_at: CreationOptional<Date>;

//   // ---------- Domain helpers ----------
//   updateInfo(data: Partial<CustomerAttributes>): void {
//     Object.assign(this, data);
//     this.updated_at = new Date();
//   }

//   addTag(tag: string): void {
//     const list = Array.isArray(this.tags) ? this.tags : [];
//     if (!list.includes(tag)) {
//       list.push(tag);
//       this.tags = list;
//     }
//   }

//   removeTag(tag: string): void {
//     const list = Array.isArray(this.tags) ? this.tags : [];
//     this.tags = list.filter((t) => t !== tag);
//   }

//   addSocialChannel(platform: string, account: unknown): void {
//     const sc = this.social_channels ?? {};
//     (sc as Record<string, unknown>)[platform] = account;
//     this.social_channels = sc;
//   }

//   removeSocialChannel(platform: string): void {
//     const sc = this.social_channels ?? {};
//     if (Object.prototype.hasOwnProperty.call(sc, platform)) {
//       delete (sc as Record<string, unknown>)[platform];
//       this.social_channels = sc;
//     }
//   }

//   // ---------- Sequelize init ----------
//   static initModel(sequelize: Sequelize): typeof Customer {
//     Customer.init(
//       {
//         customer_id: {
//           type: DataTypes.UUID,
//           defaultValue: DataTypes.UUIDV4,
//           primaryKey: true,
//         },
//         full_name: { type: DataTypes.STRING, allowNull: false },
//         customer_type: { type: DataTypes.STRING, allowNull: true },
//         birth_date: { type: DataTypes.DATE, allowNull: true },
//         gender: { type: DataTypes.STRING, allowNull: true },
//         email: { type: DataTypes.STRING, allowNull: true, unique: true },
//         phone: { type: DataTypes.STRING, allowNull: true, unique: true },
//         address: { type: DataTypes.TEXT, allowNull: true },
//         social_channels: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
//         source: { type: DataTypes.STRING, allowNull: true },
//         tags: { type: DataTypes.ARRAY(DataTypes.STRING), allowNull: false, defaultValue: [] },
//         notes: { type: DataTypes.TEXT, allowNull: true },
//         // created_at / updated_at: tự quản bởi timestamps + underscored
//         created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
//         updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
//       },
//       {
//         sequelize,
//         modelName: 'Customer',
//         tableName: 'customers',
//         timestamps: true,
//         underscored: true, // -> created_at, updated_at
//       }
//     );
//     return Customer;
//   }

//   toJSON(): CustomerAttributes {
//     return {
//       customer_id: this.customer_id,
//       full_name: this.full_name,
//       customer_type: this.customer_type,
//       birth_date: this.birth_date,
//       gender: this.gender,
//       email: this.email,
//       phone: this.phone,
//       address: this.address,
//       social_channels: this.social_channels,
//       source: this.source,
//       tags: this.tags,
//       notes: this.notes,
//       created_at: this.created_at!,
//       updated_at: this.updated_at!,
//     };
//   }
// }

// export default Customer;

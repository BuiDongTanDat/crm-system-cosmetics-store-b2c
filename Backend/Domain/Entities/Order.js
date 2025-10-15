// // backend/src/Domain/Entities/Order.ts
// import {
//   DataTypes,
//   Model,
//   Optional,
//   Sequelize,
//   InferAttributes,
//   InferCreationAttributes,
//   CreationOptional,
// } from 'sequelize';

// /** ====== Shared Types ====== */
// export type CurrencyCode = 'VND' | 'USD' | 'EUR' | string;
// export type OrderStatus =
//   | 'paid'
//   | 'pending'
//   | 'cancelled'
//   | 'refunded'
//   | 'failed'
//   | 'processing'
//   | 'shipped'
//   | 'completed';

// /** ====== Domain Entity (business object, không phụ thuộc ORM) ====== */
// export interface OrderProps {
//   order_id?: string;
//   customer_id: string;
//   order_date?: Date | string | null;
//   total_amount: number;               // entity giữ number
//   currency?: CurrencyCode;
//   payment_method?: string | null;
//   status?: OrderStatus;
//   channel?: string | null;
//   ai_suggested_crosssell?: string[];
//   notes?: string | null;
//   created_at?: Date | string;
//   updated_at?: Date | string;
// }

// export class Order {
//   order_id?: string;
//   customer_id: string;
//   order_date: Date;
//   total_amount: number;
//   currency: CurrencyCode;
//   payment_method: string | null;
//   status: OrderStatus;
//   channel: string | null;
//   ai_suggested_crosssell: string[];
//   notes: string | null;
//   created_at: Date;
//   updated_at: Date;

//   constructor(props: OrderProps) {
//     this.order_id = props.order_id;
//     this.customer_id = props.customer_id;
//     this.order_date = props.order_date ? new Date(props.order_date) : new Date();
//     this.total_amount = Number(props.total_amount);
//     this.currency = props.currency ?? 'VND';
//     this.payment_method = props.payment_method ?? null;
//     this.status = props.status ?? 'paid';
//     this.channel = props.channel ?? null;
//     this.ai_suggested_crosssell = Array.isArray(props.ai_suggested_crosssell)
//       ? props.ai_suggested_crosssell
//       : [];
//     this.notes = props.notes ?? null;
//     this.created_at = props.created_at ? new Date(props.created_at) : new Date();
//     this.updated_at = props.updated_at ? new Date(props.updated_at) : new Date();
//   }

//   static from(input: OrderProps): Order {
//     return new Order(input);
//   }

//   updateStatus(newStatus: OrderStatus): void {
//     this.status = newStatus;
//     this.updated_at = new Date();
//   }

//   toJSON() {
//     return {
//       order_id: this.order_id ?? '',
//       customer_id: this.customer_id,
//       order_date: this.order_date,
//       total_amount: this.total_amount,
//       currency: this.currency,
//       payment_method: this.payment_method,
//       status: this.status,
//       channel: this.channel,
//       ai_suggested_crosssell: this.ai_suggested_crosssell,
//       notes: this.notes,
//       created_at: this.created_at,
//       updated_at: this.updated_at,
//     };
//   }
// }

// /** ====== Sequelize Model (mapping DB) ====== */
// export interface OrderAttributes {
//   order_id: string;
//   customer_id: string;
//   order_date: Date;
//   total_amount: string;               // DECIMAL → string khi đọc từ PG
//   currency: CurrencyCode;
//   payment_method: string | null;
//   status: OrderStatus;
//   channel: string | null;
//   ai_suggested_crosssell: string[];
//   notes: string | null;
//   created_at: Date;
//   updated_at: Date;
// }

// export type OrderCreationAttributes = Optional<
//   OrderAttributes,
//   | 'order_id'
//   | 'order_date'
//   | 'currency'
//   | 'payment_method'
//   | 'status'
//   | 'channel'
//   | 'ai_suggested_crosssell'
//   | 'notes'
//   | 'created_at'
//   | 'updated_at'
// >;

// export class OrderModel
//   extends Model<InferAttributes<OrderModel>, InferCreationAttributes<OrderModel>>
//   implements OrderAttributes
// {
//   declare order_id: CreationOptional<string>;
//   declare customer_id: string;
//   declare order_date: CreationOptional<Date>;
//   declare total_amount: string;
//   declare currency: CurrencyCode;
//   declare payment_method: string | null;
//   declare status: OrderStatus;
//   declare channel: string | null;
//   declare ai_suggested_crosssell: string[];
//   declare notes: string | null;
//   declare created_at: CreationOptional<Date>;
//   declare updated_at: CreationOptional<Date>;

//   /** Map Model -> Domain Entity */
//   toEntity(): Order {
//     return new Order({
//       order_id: this.order_id,
//       customer_id: this.customer_id,
//       order_date: this.order_date,
//       total_amount: Number(this.total_amount), // parse DECIMAL string -> number cho entity
//       currency: this.currency,
//       payment_method: this.payment_method,
//       status: this.status,
//       channel: this.channel,
//       ai_suggested_crosssell: this.ai_suggested_crosssell ?? [],
//       notes: this.notes,
//       created_at: this.created_at,
//       updated_at: this.updated_at,
//     });
//   }

//   /** Map Domain Entity -> plain for upsert */
//   static fromEntity(entity: Order): OrderCreationAttributes {
//     return {
//       order_id: entity.order_id,
//       customer_id: entity.customer_id,
//       order_date: entity.order_date,
//       total_amount: entity.total_amount.toFixed(2), // lưu DECIMAL(18,2)
//       currency: entity.currency,
//       payment_method: entity.payment_method,
//       status: entity.status,
//       channel: entity.channel,
//       ai_suggested_crosssell: entity.ai_suggested_crosssell,
//       notes: entity.notes,
//       created_at: entity.created_at,
//       updated_at: entity.updated_at,
//     };
//   }

//   /** Khởi tạo model */
//   static initModel(sequelize: Sequelize): typeof OrderModel {
//     OrderModel.init(
//       {
//         order_id: {
//           type: DataTypes.UUID,
//           defaultValue: DataTypes.UUIDV4,
//           primaryKey: true,
//         },
//         customer_id: { type: DataTypes.UUID, allowNull: false },
//         order_date: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
//         total_amount: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
//         currency: { type: DataTypes.STRING(8), allowNull: false, defaultValue: 'VND' },
//         payment_method: { type: DataTypes.STRING, allowNull: true },
//         status: {
//           type: DataTypes.ENUM(
//             'paid',
//             'pending',
//             'cancelled',
//             'refunded',
//             'failed',
//             'processing',
//             'shipped',
//             'completed'
//           ),
//           allowNull: false,
//           defaultValue: 'paid',
//         },
//         channel: { type: DataTypes.STRING, allowNull: true },
//         ai_suggested_crosssell: { type: DataTypes.JSONB, allowNull: false, defaultValue: [] },
//         notes: { type: DataTypes.TEXT, allowNull: true },

//         // timestamps (khai báo để khớp typing TS)
//         created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
//         updated_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
//       },
//       {
//         sequelize,
//         modelName: 'Order',
//         tableName: 'orders',
//         timestamps: true,
//         underscored: true,
//         indexes: [
//           { fields: ['customer_id'] },
//           { fields: ['status'] },
//           { fields: ['order_date'] },
//         ],
//       }
//     );
//     return OrderModel;
//   }
// }

// export default OrderModel;

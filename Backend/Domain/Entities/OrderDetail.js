// import {
//   DataTypes,
//   Model,
//   Optional,
//   Sequelize,
//   InferAttributes,
//   InferCreationAttributes,
//   CreationOptional,
// } from 'sequelize';

// /* ========= Domain Entity ========= */
// export interface OrderDetailProps {
//   order_detail_id?: string;
//   order_id: string;
//   product_id: string;
//   quantity: number;
//   price_unit: number; // entity giữ number
//   discount?: number; // 0..1 (hoặc tiền) — tuỳ rule của bạn
//   created_at?: Date | string;
// }

// export class OrderDetail {
//   order_detail_id?: string;
//   order_id: string;
//   product_id: string;
//   quantity: number;
//   price_unit: number;
//   discount: number;
//   created_at: Date;

//   constructor(props: OrderDetailProps) {
//     this.order_detail_id = props.order_detail_id;
//     this.order_id = props.order_id;
//     this.product_id = props.product_id;
//     this.quantity = Math.max(0, Math.trunc(Number(props.quantity || 0)));
//     this.price_unit = Number(props.price_unit);
//     this.discount = Number(props.discount ?? 0);
//     this.created_at = props.created_at ? new Date(props.created_at) : new Date();
//   }

//   static from(input: OrderDetailProps): OrderDetail {
//     return new OrderDetail(input);
//   }

//   get lineTotal(): number {
//     // Nếu discount là phần trăm (0..1)
//     const gross = this.price_unit * this.quantity;
//     const net = gross * (1 - this.discount);
//     return Math.max(0, net);
//   }

//   toJSON() {
//     return {
//       order_detail_id: this.order_detail_id ?? '',
//       order_id: this.order_id,
//       product_id: this.product_id,
//       quantity: this.quantity,
//       price_unit: this.price_unit,
//       discount: this.discount,
//       created_at: this.created_at,
//     };
//   }
// }

// /* ========= Sequelize Model ========= */
// export interface OrderDetailAttributes {
//   order_detail_id: string;
//   order_id: string;
//   product_id: string;
//   quantity: number;
//   price_unit: string; // DECIMAL -> string khi đọc từ DB
//   discount: string;
//   created_at: Date;
// }

// /**
//  * ⚙️ Fix: Thay vì Optional (chỉ bỏ qua field),
//  * ta định nghĩa lại dạng cho phép undefined để tránh lỗi với exactOptionalPropertyTypes.
//  */
// export type OrderDetailCreationAttributes = {
//   order_detail_id?: string | undefined;
//   order_id: string;
//   product_id: string;
//   quantity: number;
//   price_unit: string;
//   discount?: string | undefined;
//   created_at?: Date | undefined;
// };

// export class OrderDetailModel
//   extends Model<InferAttributes<OrderDetailModel>, InferCreationAttributes<OrderDetailModel>>
//   implements OrderDetailAttributes
// {
//   declare order_detail_id: CreationOptional<string>;
//   declare order_id: string;
//   declare product_id: string;
//   declare quantity: number;
//   declare price_unit: string;
//   declare discount: string;
//   declare created_at: CreationOptional<Date>;

//   /* Map Model -> Domain Entity */
//   toEntity(): OrderDetail {
//     return new OrderDetail({
//       order_detail_id: this.order_detail_id,
//       order_id: this.order_id,
//       product_id: this.product_id,
//       quantity: this.quantity,
//       price_unit: Number(this.price_unit),
//       discount: Number(this.discount),
//       created_at: this.created_at,
//     });
//   }

//   /* Map Domain Entity -> Plain object cho create/update */
//   static fromEntity(entity: OrderDetail): OrderDetailCreationAttributes {
//     return {
//       ...(entity.order_detail_id ? { order_detail_id: entity.order_detail_id } : {}),
//       order_id: entity.order_id,
//       product_id: entity.product_id,
//       quantity: entity.quantity,
//       price_unit: entity.price_unit.toFixed(2),
//       discount: entity.discount.toFixed(4),
//       created_at: entity.created_at,
//     };
//   }

//   static initModel(sequelize: Sequelize): typeof OrderDetailModel {
//     OrderDetailModel.init(
//       {
//         order_detail_id: {
//           type: DataTypes.UUID,
//           defaultValue: DataTypes.UUIDV4,
//           primaryKey: true,
//         },
//         order_id: { type: DataTypes.UUID, allowNull: false },
//         product_id: { type: DataTypes.UUID, allowNull: false },
//         quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
//         price_unit: { type: DataTypes.DECIMAL(18, 2), allowNull: false },
//         // tuỳ business: nếu discount là phần trăm (0..1) thì nên DECIMAL(5,4); nếu là tiền, đổi sang (18,2)
//         discount: { type: DataTypes.DECIMAL(5, 4), allowNull: false, defaultValue: 0.0 },
//         created_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
//       },
//       {
//         sequelize,
//         modelName: 'OrderDetail',
//         tableName: 'order_details',
//         timestamps: false,
//         underscored: true,
//         indexes: [
//           { fields: ['order_id'] },
//           { fields: ['product_id'] },
//         ],
//       }
//     );
//     return OrderDetailModel;
//   }
// }

// export default OrderDetailModel;

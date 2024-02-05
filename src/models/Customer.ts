import { prop, getModelForClass, modelOptions } from "@typegoose/typegoose";
import { type Base } from "@typegoose/typegoose/lib/defaultClasses";
import { Types } from "mongoose";

// Enum for status
enum CustomerStatus {
  ACTIVE = "active",
  PAUSED = "paused",
  INACTIVE = "inactive",
}

@modelOptions({
  schemaOptions: {
    timestamps: { updatedAt: "modifiedAt" },
    toObject: { virtuals: true },
  },
})
export class BaseEntity implements Base {
  _id!: Types.ObjectId;

  id!: string;

  @prop()
  public updatedAt!: Date;

  @prop()
  public createdAt!: Date;
}

@modelOptions({ schemaOptions: { timestamps: true } })
export class Customer extends BaseEntity {
  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  phone!: string;

  @prop({ required: true })
  email!: string;

  @prop({ required: true })
  fyersId!: string;

  @prop({ required: true })
  fyersAppId!: string;

  @prop({ required: true })
  fyersSecretId!: string;

  @prop()
  botToken?: string;

  @prop({ required: true })
  fyersPin!: string;

  @prop({ required: true })
  fyersRedirectUrl!: string;

  @prop()
  telegramBotToken?: string;

  @prop()
  telegramNotificationChannel?: string;

  @prop()
  lastRenewedData?: Date;

  @prop({ type: String, enum: CustomerStatus, default: CustomerStatus.ACTIVE })
  status!: CustomerStatus;

  @prop({ default: 15 })
  tradeQty!: number;

  @prop()
  totpKey!: string;

  @prop({ default: 0 })
  accountBalance!: number;
}

// Create the Customer model
export const CustomerModel = getModelForClass(Customer);

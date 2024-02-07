import {
  prop,
  getModelForClass,
  modelOptions,
  index,
} from "@typegoose/typegoose";
import { BaseEntity } from "./BaseEntity";

export class UserMetadata {
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

  @prop()
  telegramBotToken?: string;

  @prop()
  telegramNotificationChannel?: string;

  @prop()
  lastRenewedData?: Date;

  @prop({ default: 15 })
  tradeQty!: number;

  @prop({ default: 0 })
  accountBalance!: number;

  @prop()
  accessToken?: string;

  @prop()
  refreshToken?: string;
}

@modelOptions({ schemaOptions: { timestamps: true } })
@index({ phone: 1 }, { unique: true })
export class User extends BaseEntity {
  @prop({ required: true })
  name!: string;

  @prop({ required: true })
  phone!: string;

  @prop({ required: true })
  password!: string;

  @prop({ default: null })
  metadata?: UserMetadata;

  @prop()
  email?: string;

  @prop({ default: false })
  isAdmin!: boolean;
}

// Create the Customer model
export const UserModel = getModelForClass(User);

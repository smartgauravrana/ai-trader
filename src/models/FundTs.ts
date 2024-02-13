import {
  prop,
  getModelForClass,
  modelOptions,
  index,
} from "@typegoose/typegoose";
import { BaseEntity } from "./BaseEntity";

@modelOptions({ schemaOptions: { timestamps: true } })
@index({ date: 1 }, { unique: true })
export class FundTs extends BaseEntity {
  @prop({ required: true })
  amount!: number;

  @prop({ required: true })
  date!: Date;
}

// Create the Customer model
export const FundTsModel = getModelForClass(FundTs);

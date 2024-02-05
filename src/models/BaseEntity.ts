import { type Base } from "@typegoose/typegoose/lib/defaultClasses";
import { Types } from "mongoose";
import { prop, modelOptions } from "@typegoose/typegoose";

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

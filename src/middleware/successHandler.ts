import type { Request, Response, NextFunction } from "express";

export type SuccessRequest = {
  data: any;
  status?: number;
};

export function successHandler(
  req: Request,
  res: Response,
  next: NextFunction
) {
  res.success = ({ data, status }: SuccessRequest) => {
    res.status(status || 200).json({ success: true, data });
  };
  next();
}

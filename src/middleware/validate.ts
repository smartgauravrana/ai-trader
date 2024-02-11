import { type Request, type Response, type NextFunction } from "express";

export function schemaValidation(zodSchema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      zodSchema.parse(req.body);
      next();
    } catch (error: any) {
      console.log("failed validation:");
      res.status(400).json({ message: error.message });
    }
  };
}

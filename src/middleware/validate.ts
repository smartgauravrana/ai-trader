import { type Request, type Response, type NextFunction } from "express";

export function schemaValidation(zodSchema: any) {
  return (req: Request, res: Response, next: NextFunction) => {
    console.log("running validation:");
    try {
      zodSchema.parse(req.body);
      next();
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  };
}

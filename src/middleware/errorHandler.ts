import type { Request, Response, NextFunction } from "express";
import { HttpError } from "http-errors";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error("Error:", err);

  // Set default status code and message
  let statusCode = 500;
  let message = "Internal server error";

  // Customize error response based on error type
  if (err instanceof CustomError || err instanceof HttpError) {
    statusCode = err.statusCode;
    message = err.message;
  }

  res.status(statusCode).json({ success: false, error: message });
}

// Custom error class
export class CustomError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
  }
}

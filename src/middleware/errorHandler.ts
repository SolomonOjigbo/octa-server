import { NextFunction, Request, Response } from "express";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  // Zod error
  if (err.errors && Array.isArray(err.errors)) {
    return res.status(400).json({
      status: "error",
      message: "Validation error",
      details: err.errors,
    });
  }
  // Prisma error (can customize for known types)
  if (err.code && err.code.startsWith("P")) {
    return res.status(400).json({
      status: "error",
      message: err.message || "Database error",
      details: err.meta,
    });
  }
  // Auth/permission error
  if (err.status && err.status === 403) {
    return res.status(403).json({
      status: "error",
      message: err.message || "Forbidden",
    });
  }
  // Fallback: internal server error
  return res.status(500).json({
    status: "error",
    message: err.message || "Internal server error",
  });
}

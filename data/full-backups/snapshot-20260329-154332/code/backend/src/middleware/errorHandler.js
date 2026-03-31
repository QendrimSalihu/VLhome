import { ZodError } from "zod";

export function errorHandler(error, _req, res, _next) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues
    });
  }

  const status = Number(error?.statusCode) || 500;
  console.error(error);
  return res.status(status).json({
    success: false,
    message: error.message || "Internal server error"
  });
}

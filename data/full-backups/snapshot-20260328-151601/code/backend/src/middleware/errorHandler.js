import { ZodError } from "zod";

export function errorHandler(error, _req, res, _next) {
  if (error instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: "Validation failed",
      errors: error.issues
    });
  }

  console.error(error);
  return res.status(500).json({
    success: false,
    message: error.message || "Internal server error"
  });
}

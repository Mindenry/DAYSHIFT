import { HttpException, HttpStatus } from "@nestjs/common";

/** Application error carrying a stable machine-readable code. */
export class AppError extends HttpException {
  constructor(
    public readonly code: string,
    message: string,
    status: HttpStatus = HttpStatus.BAD_REQUEST,
    public readonly details?: unknown,
  ) {
    super(message, status);
  }

  static notFound(message = "Resource not found") {
    return new AppError("NOT_FOUND", message, HttpStatus.NOT_FOUND);
  }
  static unauthorized(message = "Sign in required") {
    return new AppError("UNAUTHORIZED", message, HttpStatus.UNAUTHORIZED);
  }
  static forbidden(message = "You do not have permission to do that") {
    return new AppError("FORBIDDEN", message, HttpStatus.FORBIDDEN);
  }
  static conflict(message = "The request conflicts with the current state", details?: unknown) {
    return new AppError("CONFLICT", message, HttpStatus.CONFLICT, details);
  }
  static validation(message = "Invalid request", details?: unknown) {
    return new AppError("VALIDATION_ERROR", message, HttpStatus.UNPROCESSABLE_ENTITY, details);
  }
  static tooMany(message = "Too many attempts. Please try again shortly.") {
    return new AppError("RATE_LIMITED", message, HttpStatus.TOO_MANY_REQUESTS);
  }
  static paymentRequired(message = "Payment is required") {
    return new AppError("PAYMENT_REQUIRED", message, HttpStatus.PAYMENT_REQUIRED);
  }
}

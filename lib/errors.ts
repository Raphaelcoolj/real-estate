/* ---------------------------------------------------------------------------
 * Application errors — mapped to ActionResult failures inside Server Actions
 * and to HTTP responses inside Route Handlers.
 * ------------------------------------------------------------------------ */

export class AppError extends Error {
  readonly status: number;
  readonly fields?: Record<string, string[]>;

  constructor(message: string, status = 400, fields?: Record<string, string[]>) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.fields = fields;
  }
}

export class AuthError extends AppError {
  constructor(message = "You need to sign in to continue.") {
    super(message, 401);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "You do not have permission to do that.") {
    super(message, 403);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends AppError {
  constructor(message = "The requested resource was not found.") {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class RateLimitError extends AppError {
  constructor(message = "Too many attempts. Please wait a moment and try again.") {
    super(message, 429);
    this.name = "RateLimitError";
  }
}

/** Convert any thrown value into a user-facing message. */
export function errorMessage(error: unknown, fallback = "Something went wrong. Please try again."): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof Error && error.message) {
    // Never leak stack traces or driver internals to the client.
    if (/E11000|duplicate key/i.test(error.message)) return "That record already exists.";
    if (/validation/i.test(error.message)) return "Please check the form and try again.";
    if (/timeout|buffering|buffer.*timed/i.test(error.message))
      return "The database is temporarily unavailable. Please try again.";
  }
  return fallback;
}

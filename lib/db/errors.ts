export class AppError extends Error {
  constructor(
    message: string,
    readonly code:
      | "duplicate_company"
      | "not_found"
      | "invalid_input"
      | "database"
      | "unauthorized" = "database",
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function toUserError(error: unknown, fallback: string): string {
  if (error instanceof AppError) {
    return error.message;
  }
  return fallback;
}

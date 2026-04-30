import { HttpException, HttpStatus } from "@nestjs/common";

export class AppException extends HttpException {
  constructor(
    message: string,
    status: HttpStatus,
    public readonly code?: string,
  ) {
    super(
      {
        statusCode: status,
        message,
        error: HttpStatus[status],
        ...(code ? { code } : {}),
      },
      status,
    );
  }
}
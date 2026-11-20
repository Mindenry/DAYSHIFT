import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { Prisma } from "@dayshift/db";
import { AppError } from "../app-error";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger("ExceptionFilter");

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const requestId = request.requestId;

    let status: number = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = "INTERNAL_ERROR";
    let message: string | string[] = "Something went wrong. Please try again.";
    let details: unknown;

    if (exception instanceof AppError) {
      status = exception.getStatus();
      code = exception.code;
      message = exception.message;
      details = exception.details;
    } else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === "P2002") {
        status = HttpStatus.CONFLICT;
        code = "DUPLICATE";
        message = "That record already exists.";
      } else if (exception.code === "P2025") {
        status = HttpStatus.NOT_FOUND;
        code = "NOT_FOUND";
        message = "The requested record could not be found.";
      } else if (exception.code === "P2003") {
        status = HttpStatus.CONFLICT;
        code = "RELATION_CONFLICT";
        message = "This record is referenced by other data and cannot be changed.";
      } else {
        status = HttpStatus.BAD_REQUEST;
        code = "DATABASE_ERROR";
        message = "The request could not be completed.";
      }
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const body = exception.getResponse();
      if (typeof body === "string") {
        message = body;
      } else if (body && typeof body === "object") {
        const bodyMessage = (body as { message?: string | string[] }).message;
        if (bodyMessage) message = bodyMessage;
      }
      code =
        status === HttpStatus.UNAUTHORIZED
          ? "UNAUTHORIZED"
          : status === HttpStatus.FORBIDDEN
            ? "FORBIDDEN"
            : status === HttpStatus.NOT_FOUND
              ? "NOT_FOUND"
              : status === HttpStatus.TOO_MANY_REQUESTS
                ? "RATE_LIMITED"
                : status === HttpStatus.UNPROCESSABLE_ENTITY
                  ? "VALIDATION_ERROR"
                  : "REQUEST_ERROR";
      if (status === HttpStatus.TOO_MANY_REQUESTS) {
        message = "Too many requests. Please slow down and try again shortly.";
      }
    } else if (exception instanceof Error) {
      // Unexpected error: log server-side, never leak internals to the client.
      this.logger.error(
        `Unhandled error ${request.method} ${request.originalUrl} [${requestId}]: ${exception.message}`,
        exception.stack,
      );
    }

    if (status >= 500) {
      this.logger.error(
        `${status} ${request.method} ${request.originalUrl} [${requestId}] ${code}`,
      );
    }

    response.status(status).json({
      statusCode: status,
      code,
      message,
      requestId,
      ...(details ? { details } : {}),
    });
  }
}

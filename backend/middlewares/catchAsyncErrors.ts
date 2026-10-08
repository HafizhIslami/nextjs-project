import { NextRequest, NextResponse } from "next/server";

type HandlerFunction<TParams> = (
  req: NextRequest,
  params: TParams
) => Promise<NextResponse>;

interface IValidation {
  message: string;
}

type ErrorDetails = {
  name?: string;
  path?: string;
  code?: number;
  keyValue?: Record<string, unknown>;
  status?: number;
  statusCode?: number;
  message?: string | string[];
  errors?: Record<string, IValidation>;
};

export const catchAsyncErrors = <TParams>(
  handler: HandlerFunction<TParams>
) => async (req: NextRequest, params: TParams): Promise<NextResponse> => {
    try {
      return await handler(req, params);
    } catch (error: unknown) {
      const details = (
        error && typeof error === "object" ? error : {}
      ) as ErrorDetails;
      let status = details.statusCode ?? details.status ?? 500;
      let message: string | string[] = details.message || "Internal server error";

      if (details.name === "CastError") {
        message = `Resource not found. Invalid ${details.path}`;
        status = 404;
      }

      if (details.name === "ValidationError") {
        message = Object.values<IValidation>(details.errors ?? {}).map(
          (val) => val.message
        );
        status = 400;
      }

      // mongoose duplicate key error handler
      if (details.code === 11000) {
        message = `Duplicate ${Object.keys(details.keyValue ?? {})} entered`;
        status = 400;
      }
      
      return NextResponse.json(
        { success: false, error: message, errMessage: message },
        { status }
      );
    }
  };

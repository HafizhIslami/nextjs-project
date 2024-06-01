import { NextRequest, NextResponse } from "next/server";

type HandlerFunction = (req: NextRequest, params: any) => Promise<Response>;

interface IValidation {
  message: string;
}

export const catchAsyncErrors =
  (handler: HandlerFunction) => async (req: NextRequest, params: any) => {
    try {
      return await handler(req, params);
    } catch (error: any) {
      if (error?.name === "CastError") {
        error.message = `Resource not found. Invalid ${error?.path}`;
        error.status = 404;
      }

      if (error?.name === "ValidationError") {
        error.message = Object.values<IValidation>(error?.errors).map(
          (val: any) => val.message
        );
        error.status = 400;
      }

      // mongoose duplicate key error handler
      if(error.code === 11000){
        error.message = `Duplicate ${Object.keys(error.keyValue)} entered`;
        error.status = 400;
      }
      
      return NextResponse.json(
        { errMessage: error.message },
        { status: error.status || 500 }
      );
    }
  };

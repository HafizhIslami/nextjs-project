import { NextRequest, NextResponse } from "next/server";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors";
import User from "../models/user";
import ErrorHandler from "../utils/errorHandler";
import { delete_file, upload_file } from "../utils/cloudinary";
import { resetPasswordHTMLTemplate } from "../utils/emailTemplates";
import sendEmail from "../utils/sendEmail";
import crypto from "crypto";
import dbConnect from "../config/dbConnect";
import {
  normalizeEmail,
  requireImageDataUrl,
  requirePassword,
  requireString,
} from "../utils/validation";

export const registerUser = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const body = await req.json();

  const name = requireString(body?.name, "Name", 30);
  const email = normalizeEmail(body?.email);
  const password = requirePassword(body?.password);

  await User.create({
    name,
    email,
    password,
  });

  return NextResponse.json({
    success: true,
  });
});

export const updateProfile = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const body = await req.json();

  const userData = {
    name: requireString(body?.name, "Name", 30),
    email: normalizeEmail(body?.email),
  };
  const user = await User.findByIdAndUpdate(req.user._id, userData, {
    new: true,
    runValidators: true,
  }).select("-password").lean().exec();

  return NextResponse.json({
    success: true,
    user,
  });
});

export const updatePassword = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const body = await req.json();

  const user = await User.findById(req?.user?._id).select("+password");
  if (!user) {
    throw new ErrorHandler("User not found", 404);
  }

  const oldPassword = requirePassword(body?.oldPassword, "Old password");
  const newPassword = requirePassword(body?.newPassword, "New password");
  const isMatched = await user.comparePassword(oldPassword);

  if (!isMatched) {
    throw new ErrorHandler("Old password is incorrect", 400);
  }

  user.password = newPassword;
  await user.save();

  return NextResponse.json({
    success: true,
  });
});

export const uploadAvatar = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const body = await req.json();

  const avatar = requireImageDataUrl(body?.avatar, "Avatar");
  const avatarResponse = await upload_file(avatar, "bookit/avatars");

  if (req?.user?.avatar?.public_id) {
    await delete_file(req?.user?.avatar?.public_id);
  }

  await User.findByIdAndUpdate(req?.user?._id, {
    avatar: avatarResponse,
  });

  return NextResponse.json({
    success: true,
  });
});

export const forgotPassword = catchAsyncErrors(async (req: NextRequest) => {
  await dbConnect({ throwOnError: true });
  const body = await req.json();

  const email = normalizeEmail(body?.email);
  const user = await User.findOne({ email });

  if (!user) {
    return NextResponse.json({
      success: true,
      message: "If an account exists, a password recovery email has been sent.",
    });
  }

  const resetToken = user.getResetPasswordToken();

  await user.save();

  const resetUrl = `${process.env.API_URL}/password/reset/${resetToken}`;

  const message = resetPasswordHTMLTemplate(user?.name, resetUrl);

  try {
    await sendEmail({
      email: user.email,
      subject: "Bookit Password Recovery",
      message,
    });
  } catch (error: unknown) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();
    throw new ErrorHandler(
      error instanceof Error ? error.message : "Unable to send password recovery email",
      500
    );
  }

  return NextResponse.json({
    success: true,
  });
});

export const resetPassword = catchAsyncErrors(
  async (req: NextRequest, { params }: { params: { token: string } }) => {
    await dbConnect({ throwOnError: true });
    const body = await req.json();
    const token = requireString(params?.token, "Reset token", 256);
    const password = requirePassword(body?.password);
    const confirmPassword = requirePassword(
      body?.confirmPassword,
      "Confirm password"
    );

    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      throw new ErrorHandler(
        "Password reset token is invalid or has been expired",
        404
      );
    }

    if (password !== confirmPassword) {
      throw new ErrorHandler("Password does not match", 400);
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return NextResponse.json({
      success: true,
    });
  }
);

// Get all users  =>  /api/admin/users
export const allAdminUsers = catchAsyncErrors(async () => {
  await dbConnect({ throwOnError: true });
  const users = await User.find().lean().exec();

  return NextResponse.json({
    users,
  });
});

// Get user details  =>  /api/admin/users/:id
export const getUserDetails = catchAsyncErrors(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    await dbConnect({ throwOnError: true });
    const user = await User.findById(params.id).lean().exec();

    if (!user) {
      throw new ErrorHandler("User not found with this ID", 404);
    }

    return NextResponse.json({
      user,
    });
  }
);

// Update user details  =>  /api/admin/users/:id
export const updateUser = catchAsyncErrors(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    await dbConnect({ throwOnError: true });
    const body = await req.json();

    const newUserData = {
      name: requireString(body?.name, "Name", 30),
      email: normalizeEmail(body?.email),
      role: body?.role,
    };

    if (newUserData.role !== "user" && newUserData.role !== "admin") {
      throw new ErrorHandler("Invalid user role", 400);
    }

    const user = await User.findByIdAndUpdate(params.id, newUserData, {
      new: true,
      runValidators: true,
    }).select("-password").lean().exec();

    if (!user) {
      throw new ErrorHandler("User not found with this ID", 404);
    }

    return NextResponse.json({
      user,
    });
  }
);

// Delete user  =>  /api/admin/users/:id
export const deleteUser = catchAsyncErrors(
  async (req: NextRequest, { params }: { params: { id: string } }) => {
    await dbConnect({ throwOnError: true });
    const user = await User.findById(params.id);

    if (!user) {
      throw new ErrorHandler("User not found with this ID", 404);
    }

    // Remove avatar from cloudinary
    if (user?.avatar?.public_id) {
      await delete_file(user?.avatar?.public_id);
    }

    await user.deleteOne();

    return NextResponse.json({
      success: true,
    });
  }
);

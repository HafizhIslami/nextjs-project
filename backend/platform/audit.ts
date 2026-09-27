import type { NextRequest } from "next/server";
import { PlatformAuditLog, type PlatformRole } from "../models/platform";

type AuditInput = {
  actorUserId?: string;
  actorRole?: PlatformRole | "system";
  action: string;
  targetType: string;
  targetId?: string;
  merchantId?: string;
  changes?: Record<string, unknown>;
  request?: NextRequest;
};

export const writePlatformAudit = async (input: AuditInput) => {
  const forwardedFor = input.request?.headers.get("x-forwarded-for");
  return PlatformAuditLog.create({
    actorUserId: input.actorUserId,
    actorRole: input.actorRole,
    action: input.action,
    targetType: input.targetType,
    targetId: input.targetId,
    merchantId: input.merchantId,
    changes: input.changes,
    request: input.request
      ? {
          requestId: input.request.headers.get("x-request-id") || undefined,
          ip: forwardedFor?.split(",")[0]?.trim() || input.request.headers.get("x-real-ip") || undefined,
          userAgent: input.request.headers.get("user-agent") || undefined,
        }
      : undefined,
  });
};


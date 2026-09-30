import { NextResponse } from "next/server";
import type { AuthorizationResult } from "@/auth/authorize";
import { DocumentStorageConfigurationError, DocumentStorageError } from "@/documents/document-storage";

export function apiError(error: string, status: number, details?: unknown) {
  return NextResponse.json(details === undefined ? { error } : { error, details }, { status });
}

export function authorizationError(result: Extract<AuthorizationResult, { ok: false }>) {
  return apiError(result.error, result.status);
}

export function documentStorageError(error: unknown, fallbackMessage: string) {
  if (error instanceof DocumentStorageConfigurationError) return apiError(error.message, 503);
  if (error instanceof DocumentStorageError) {
    const status = error.status >= 400 && error.status < 600 ? error.status : 502;
    return apiError("Penyimpanan dokumen tidak tersedia", status);
  }
  return apiError(fallbackMessage, 500);
}

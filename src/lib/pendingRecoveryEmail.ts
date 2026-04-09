const KEY = "tellacity_pending_recovery_email";

/** Remember which address we sent a recovery email to (prefills the code form). */
export function setPendingRecoveryEmail(email: string): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(KEY, email.trim().toLowerCase());
  } catch {
    /* quota / private mode */
  }
}

export function peekPendingRecoveryEmail(): string {
  if (typeof window === "undefined") return "";
  try {
    return sessionStorage.getItem(KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function clearPendingRecoveryEmail(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* */
  }
}

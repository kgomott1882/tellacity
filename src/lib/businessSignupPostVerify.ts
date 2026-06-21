/** Browser session hint after unified signup OTP (account + domain claim). */
export const SIGNUP_VERIFY_SESSION_KEY = "tellacity_signup_verify_complete";

export type SignupVerifySession = {
  businessId?: string | null;
  outcome?: "claimed" | "already_claimed" | "new_business";
  growTrialPending?: boolean;
  ts: number;
};

const MAX_AGE_MS = 5 * 60 * 1000;

export function writeSignupVerifySession(session: Omit<SignupVerifySession, "ts">): void {
  if (typeof window === "undefined") return;
  try {
    const payload: SignupVerifySession = { ...session, ts: Date.now() };
    window.sessionStorage.setItem(SIGNUP_VERIFY_SESSION_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function readSignupVerifySession(): SignupVerifySession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(SIGNUP_VERIFY_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SignupVerifySession;
    if (!parsed?.ts || Date.now() - parsed.ts > MAX_AGE_MS) {
      window.sessionStorage.removeItem(SIGNUP_VERIFY_SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearSignupVerifySession(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(SIGNUP_VERIFY_SESSION_KEY);
  } catch {
    /* ignore */
  }
}

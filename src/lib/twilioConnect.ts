import axios from "axios";

const ACCOUNT_SID_RE = /^AC[a-fA-F0-9]{32}$/;
const MESSAGING_SERVICE_SID_RE = /^MG[a-fA-F0-9]{32}$/;

export function normalizeTwilioAccountSid(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || !ACCOUNT_SID_RE.test(trimmed)) return null;
  return trimmed;
}

export function normalizeTwilioAuthToken(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length < 16) return null;
  return trimmed;
}

/** Normalize to E.164 (+country digits). */
export function normalizeTwilioFromPhone(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  const digits = trimmed.replace(/[^\d+]/g, "");
  if (!digits) return null;
  const withPlus = digits.startsWith("+") ? digits : `+${digits}`;
  if (!/^\+[1-9]\d{6,14}$/.test(withPlus)) return null;
  return withPlus;
}

export function normalizeTwilioMessagingServiceSid(
  raw: string | null | undefined,
): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  if (!MESSAGING_SERVICE_SID_RE.test(trimmed)) return null;
  return trimmed;
}

type TwilioAccountResponse = {
  sid?: string;
  friendly_name?: string;
  status?: string;
};

function twilioAuth(accountSid: string, authToken: string) {
  return { username: accountSid, password: authToken };
}

/** Verify Twilio Account SID + auth token via the Accounts API. */
export async function verifyTwilioCredentials(
  accountSid: string,
  authToken: string,
  options?: {
    from_phone_number?: string | null;
    messaging_service_sid?: string | null;
  },
): Promise<
  | {
      ok: true;
      account_friendly_name: string | null;
      from_phone_number: string | null;
      messaging_service_sid: string | null;
    }
  | { ok: false; message: string }
> {
  const sid = normalizeTwilioAccountSid(accountSid);
  const token = normalizeTwilioAuthToken(authToken);
  if (!sid) {
    return {
      ok: false,
      message: "Account SID is invalid. Copy it from the Twilio Console (starts with AC).",
    };
  }
  if (!token) {
    return { ok: false, message: "Auth token is required." };
  }

  const fromPhone = normalizeTwilioFromPhone(options?.from_phone_number);
  const messagingSid = normalizeTwilioMessagingServiceSid(options?.messaging_service_sid);

  if (options?.from_phone_number?.trim() && !fromPhone) {
    return {
      ok: false,
      message: "Sender phone number must be in E.164 format, for example +14155552671.",
    };
  }
  if (options?.messaging_service_sid?.trim() && !messagingSid) {
    return {
      ok: false,
      message: "Messaging Service SID must start with MG and be 34 characters.",
    };
  }

  try {
    const accountRes = await axios.get<TwilioAccountResponse>(
      `https://api.twilio.com/2010-04-01/Accounts/${sid}.json`,
      {
        auth: twilioAuth(sid, token),
        timeout: 20_000,
        validateStatus: () => true,
      },
    );

    if (accountRes.status === 401 || accountRes.status === 403) {
      return {
        ok: false,
        message:
          "Twilio rejected these credentials. Check Account SID and Auth Token in the Twilio Console.",
      };
    }
    if (accountRes.status !== 200 || !accountRes.data?.sid) {
      return {
        ok: false,
        message: `Twilio returned HTTP ${accountRes.status}. Check your credentials and try again.`,
      };
    }

    const friendlyName =
      typeof accountRes.data.friendly_name === "string" && accountRes.data.friendly_name.trim()
        ? accountRes.data.friendly_name.trim()
        : null;

    if (fromPhone) {
      const phoneRes = await axios.get(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/IncomingPhoneNumbers.json`,
        {
          auth: twilioAuth(sid, token),
          params: { PhoneNumber: fromPhone },
          timeout: 20_000,
          validateStatus: () => true,
        },
      );
      const numbers = (phoneRes.data as { incoming_phone_numbers?: { phone_number?: string }[] })
        ?.incoming_phone_numbers;
      const found = Array.isArray(numbers) && numbers.some((n) => n.phone_number === fromPhone);
      if (!found) {
        return {
          ok: false,
          message:
            "That sender number is not on this Twilio account. Buy or port a number, or leave the field blank to connect first.",
        };
      }
    }

    if (messagingSid) {
      const msRes = await axios.get(
        `https://messaging.twilio.com/v1/Services/${messagingSid}`,
        {
          auth: twilioAuth(sid, token),
          timeout: 20_000,
          validateStatus: () => true,
        },
      );
      if (msRes.status === 404) {
        return {
          ok: false,
          message: "Messaging Service SID was not found on this Twilio account.",
        };
      }
      if (msRes.status === 401 || msRes.status === 403) {
        return {
          ok: false,
          message: "Could not verify the Messaging Service SID with these credentials.",
        };
      }
      if (msRes.status !== 200) {
        return {
          ok: false,
          message: `Twilio returned HTTP ${msRes.status} when checking the Messaging Service.`,
        };
      }
    }

    return {
      ok: true,
      account_friendly_name: friendlyName,
      from_phone_number: fromPhone,
      messaging_service_sid: messagingSid,
    };
  } catch (e) {
    const msg = axios.isAxiosError(e) ? e.message : "Connection failed";
    return {
      ok: false,
      message: `Could not reach Twilio (${msg}). Try again in a moment.`,
    };
  }
}

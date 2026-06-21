import { createSign } from "crypto";
import axios from "axios";

const SPREADSHEET_ID_RE = /^[a-zA-Z0-9-_]{20,}$/;

export type GoogleServiceAccountCredentials = {
  client_email: string;
  private_key: string;
};

export function normalizeGoogleSpreadsheetId(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  const docsMatch = trimmed.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  if (docsMatch?.[1]) return docsMatch[1];

  if (SPREADSHEET_ID_RE.test(trimmed)) return trimmed;
  return null;
}

export function normalizeGoogleWorksheetName(raw: string | null | undefined): string | null {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return null;
  if (trimmed.length > 100) return trimmed.slice(0, 100);
  return trimmed;
}

function base64Url(input: Buffer | string): string {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf.toString("base64url");
}

function normalizePrivateKey(key: string): string {
  return key.replace(/\\n/g, "\n").trim();
}

/** Parse a Google Cloud service account JSON key. */
export function parseGoogleServiceAccountJson(
  raw: string,
): { ok: true; credentials: GoogleServiceAccountCredentials } | { ok: false; message: string } {
  const trimmed = raw.trim();
  if (!trimmed) {
    return { ok: false, message: "Service account JSON is required." };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(trimmed);
  } catch {
    return {
      ok: false,
      message: "Service account JSON is not valid JSON. Paste the full file from Google Cloud.",
    };
  }

  if (!parsed || typeof parsed !== "object") {
    return { ok: false, message: "Service account JSON must be an object." };
  }

  const o = parsed as Record<string, unknown>;
  const clientEmail =
    typeof o.client_email === "string" && o.client_email.trim() ? o.client_email.trim() : "";
  const privateKey =
    typeof o.private_key === "string" && o.private_key.trim()
      ? normalizePrivateKey(o.private_key)
      : "";

  if (!clientEmail || !clientEmail.includes("@")) {
    return { ok: false, message: "Service account JSON is missing client_email." };
  }
  if (!privateKey.includes("BEGIN PRIVATE KEY")) {
    return { ok: false, message: "Service account JSON is missing private_key." };
  }

  return { ok: true, credentials: { client_email: clientEmail, private_key: privateKey } };
}

async function getGoogleSheetsAccessToken(
  credentials: GoogleServiceAccountCredentials,
): Promise<{ ok: true; access_token: string } | { ok: false; message: string }> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: credentials.client_email,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;

  try {
    const sign = createSign("RSA-SHA256");
    sign.update(unsigned);
    sign.end();
    const signature = sign.sign(credentials.private_key);
    const jwt = `${unsigned}.${base64Url(signature)}`;

    const tokenRes = await axios.post<{ access_token?: string; error?: string }>(
      "https://oauth2.googleapis.com/token",
      new URLSearchParams({
        grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
        assertion: jwt,
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        timeout: 20_000,
        validateStatus: () => true,
      },
    );

    const accessToken =
      typeof tokenRes.data?.access_token === "string" ? tokenRes.data.access_token.trim() : "";
    if (!accessToken) {
      const err = tokenRes.data?.error ?? `HTTP ${tokenRes.status}`;
      return {
        ok: false,
        message: `Google rejected the service account key (${err}). Check the JSON and that Sheets API is enabled.`,
      };
    }

    return { ok: true, access_token: accessToken };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Token exchange failed";
    return {
      ok: false,
      message: `Could not authenticate with Google (${msg}). Check the private_key in your JSON file.`,
    };
  }
}

type SheetsMetadata = {
  properties?: { title?: string };
  sheets?: { properties?: { title?: string } }[];
};

/** Verify spreadsheet access with a Google service account. */
export async function verifyGoogleSheetsConnection(
  spreadsheetRaw: string,
  serviceAccountJson: string,
  worksheetName?: string | null,
): Promise<
  | {
      ok: true;
      spreadsheet_id: string;
      spreadsheet_title: string | null;
      worksheet_name: string | null;
      service_account_email: string;
      private_key: string;
    }
  | { ok: false; message: string }
> {
  const spreadsheetId = normalizeGoogleSpreadsheetId(spreadsheetRaw);
  if (!spreadsheetId) {
    return {
      ok: false,
      message:
        "Spreadsheet ID or URL is invalid. Paste a Google Sheets link or the ID from the URL.",
    };
  }

  const parsed = parseGoogleServiceAccountJson(serviceAccountJson);
  if (!parsed.ok) {
    return parsed;
  }

  const worksheet = normalizeGoogleWorksheetName(worksheetName);
  if (worksheetName?.trim() && !worksheet) {
    return { ok: false, message: "Worksheet tab name is too long." };
  }

  const tokenResult = await getGoogleSheetsAccessToken(parsed.credentials);
  if (!tokenResult.ok) {
    return tokenResult;
  }

  try {
    const metaRes = await axios.get<SheetsMetadata>(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      {
        params: { fields: "properties.title,sheets.properties.title" },
        headers: { Authorization: `Bearer ${tokenResult.access_token}` },
        timeout: 20_000,
        validateStatus: () => true,
      },
    );

    if (metaRes.status === 403) {
      return {
        ok: false,
        message: `Share the spreadsheet with ${parsed.credentials.client_email} as Editor, then try again.`,
      };
    }
    if (metaRes.status === 404) {
      return {
        ok: false,
        message: "Spreadsheet was not found. Check the URL or ID.",
      };
    }
    if (metaRes.status !== 200) {
      return {
        ok: false,
        message: `Google Sheets returned HTTP ${metaRes.status}. Check the spreadsheet and API access.`,
      };
    }

    const spreadsheetTitle =
      typeof metaRes.data?.properties?.title === "string" &&
      metaRes.data.properties.title.trim()
        ? metaRes.data.properties.title.trim()
        : null;

    if (worksheet) {
      const sheetTitles =
        metaRes.data?.sheets
          ?.map((s) => s.properties?.title)
          .filter((t): t is string => typeof t === "string" && t.trim().length > 0) ?? [];
      const found = sheetTitles.some((t) => t.toLowerCase() === worksheet.toLowerCase());
      if (!found) {
        return {
          ok: false,
          message: `Worksheet tab "${worksheet}" was not found. Check the tab name at the bottom of the spreadsheet.`,
        };
      }
    }

    return {
      ok: true,
      spreadsheet_id: spreadsheetId,
      spreadsheet_title: spreadsheetTitle,
      worksheet_name: worksheet,
      service_account_email: parsed.credentials.client_email,
      private_key: parsed.credentials.private_key,
    };
  } catch (e) {
    const msg = axios.isAxiosError(e) ? e.message : "Connection failed";
    return {
      ok: false,
      message: `Could not reach Google Sheets (${msg}). Try again in a moment.`,
    };
  }
}

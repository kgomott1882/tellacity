"use client";

import { useCallback, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CloudUpload, Lightbulb, ChevronRight } from "lucide-react";
import { useBusinessContext } from "../../../../_context/BusinessContext";
import { supabaseBrowser } from "@/lib/supabaseBrowser";
import { getActiveCountry } from "@/lib/getActiveCountry";

const MAX_LOCATIONS = 2000;

const CSV_COLUMNS = [
  { key: "location_name", label: "Location name", required: true, example: "New York" },
  { key: "id", label: "ID", required: true, example: "001" },
  { key: "street_address", label: "Street address", required: true, example: "Main Street 1" },
  { key: "street_address_2", label: "Street address 2", required: false, example: "5th floor" },
  { key: "zip_code", label: "ZIP code", required: true, example: "1112" },
  { key: "city", label: "City", required: true, example: "New York City" },
  { key: "state_region", label: "State/Province/Region", required: false, example: "New York" },
  { key: "country_code", label: "Country code", required: true, example: "US" },
  { key: "phone", label: "Phone number", required: false, example: "+1-123-456-7890" },
  { key: "website", label: "Website", required: false, example: "www.mywebsite.com" },
];

type ParsedLocation = {
  location_name: string;
  id: string;
  street_address: string;
  street_address_2: string;
  zip_code: string;
  city: string;
  state_region: string;
  country_code: string;
  phone: string;
  website: string;
};

function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s*[*]\s*$/, "").replace(/\s+/g, "_").replace(/\//g, "_");
}

function parseCSV(text: string): ParsedLocation[] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim());
  if (lines.length < 2) return [];
  const header = lines[0];
  const headerCols = header.split(",").map((h) => normalizeHeader(h));
  const rows: ParsedLocation[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    headerCols.forEach((col, idx) => {
      row[col] = values[idx]?.trim() ?? "";
    });
    rows.push({
      location_name: row["location_name"] ?? "",
      id: row["id"] ?? "",
      street_address: row["street_address"] ?? "",
      street_address_2: row["street_address_2"] ?? "",
      zip_code: row["zip_code"] ?? "",
      city: row["city"] ?? "",
      state_region: row["state_region"] ?? row["state_province_region"] ?? "",
      country_code: row["country_code"] ?? "",
      phone: row["phone"] ?? row["phone_number"] ?? "",
      website: row["website"] ?? "",
    });
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      inQuotes = !inQuotes;
    } else if (c === "," && !inQuotes) {
      result.push(current);
      current = "";
    } else {
      current += c;
    }
  }
  result.push(current);
  return result;
}

function validateRows(rows: ParsedLocation[]): { valid: ParsedLocation[]; errors: string[] } {
  const errors: string[] = [];
  if (rows.length > MAX_LOCATIONS) {
    errors.push(`Please don't import more than ${MAX_LOCATIONS} locations at once. You have ${rows.length}.`);
  }
  const valid: ParsedLocation[] = [];
  rows.forEach((row, idx) => {
    const lineNum = idx + 2;
    if (!row.location_name?.trim()) errors.push(`Row ${lineNum}: Location name is required.`);
    if (!row.id?.trim()) errors.push(`Row ${lineNum}: ID is required.`);
    if (!row.street_address?.trim()) errors.push(`Row ${lineNum}: Street address is required.`);
    if (!row.zip_code?.trim()) errors.push(`Row ${lineNum}: ZIP code is required.`);
    if (!row.city?.trim()) errors.push(`Row ${lineNum}: City is required.`);
    if (!row.country_code?.trim()) errors.push(`Row ${lineNum}: Country code is required.`);
    if (row.location_name?.trim() && row.id?.trim() && row.street_address?.trim() && row.zip_code?.trim() && row.city?.trim() && row.country_code?.trim()) {
      valid.push(row);
    }
  });
  return { valid: rows.length <= MAX_LOCATIONS ? valid : [], errors };
}

function buildExampleCSV(): string {
  const header = CSV_COLUMNS.map((c) => c.label).join(",");
  const example = "New York,001,Main Street 1,5th floor,1112,New York City,New York,US,+1-123-456-7890,www.mywebsite.com";
  return `${header}\n${example}`;
}

export default function ImportLocationsPage() {
  const router = useRouter();
  const { selectedBusiness } = useBusinessContext();
  const [step, setStep] = useState<1 | 2>(1);
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedLocation[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const businessId = selectedBusiness?.id ?? null;
  const locationsHref = "/business/dashboard/settings/public/locations";

  const handleFile = useCallback(
    (f: File | null) => {
      if (!f) {
        setFile(null);
        setParsed([]);
        setValidationErrors([]);
        setStep(1);
        return;
      }
      if (!f.name.toLowerCase().endsWith(".csv")) {
        setMessage({ type: "error", text: "Please upload a CSV file." });
        return;
      }
      setFile(f);
      setMessage(null);
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        const rows = parseCSV(text);
        const { valid, errors } = validateRows(rows);
        setValidationErrors(errors);
        setParsed(valid);
        setStep(2);
      };
      reader.readAsText(f, "UTF-8");
    },
    []
  );

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = () => setDragActive(false);

  const handleConfirmImport = async () => {
    if (!businessId || parsed.length === 0) return;
    setMessage(null);
    setImporting(true);
    const rows = parsed.map((row) => {
      const addressPart2 = row.street_address_2.trim();
      const address = row.street_address.trim() + (addressPart2 ? " " + addressPart2 : "");
      return {
        business_id: businessId,
        name: row.location_name.trim(),
        external_id: row.id.trim() || null,
        address: address || null,
        street_address_2: row.street_address_2.trim() || null,
        postcode: row.zip_code.trim() || null,
        city: row.city.trim() || null,
        state_region: row.state_region.trim() || null,
        country_code: row.country_code.trim() || getActiveCountry() || "",
        phone: row.phone.trim() || null,
        website: row.website.trim() || null,
      };
    });
    const { error } = await supabaseBrowser.from("business_locations").insert(rows);
    setImporting(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "success", text: `${parsed.length} location(s) imported.` });
    setTimeout(() => router.push(locationsHref), 1500);
  };

  const handleDownloadExample = () => {
    const blob = new Blob([buildExampleCSV()], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "locations_example.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!selectedBusiness) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-[#0E0E0E]">Import multiple locations</h1>
        <p className="mt-2 text-sm text-gray-600">Select a business from the sidebar first.</p>
        <Link href={locationsHref} className="mt-4 inline-block text-sm font-medium text-[#124541] hover:underline">
          Back to Locations
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl">
      {/* Breadcrumbs */}
      <nav className="flex items-center gap-2 text-sm text-gray-600">
        <Link href={locationsHref} className="hover:text-[#124541] hover:underline">
          Locations
        </Link>
        <ChevronRight size={16} className="text-gray-400" />
        <span className="text-[#0E0E0E]">Import multiple locations</span>
      </nav>

      <h1 className="mt-4 text-2xl font-semibold text-[#0E0E0E]">Import multiple locations</h1>

      {message && (
        <div
          className={`mt-4 rounded-lg border px-4 py-3 text-sm ${
            message.type === "success" ? "border-green-200 bg-green-50 text-green-800" : "border-red-200 bg-red-50 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      {/* Steps */}
      <div className="mt-6 flex gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${step >= 1 ? "border-[#2fb2a8] bg-[#2fb2a8] text-white" : "border-gray-300 text-gray-500"}`}>
          1
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[#0E0E0E]">Upload CSV file</p>
          <p className="text-sm text-gray-600">Upload a file with your location data</p>
        </div>
      </div>
      <div className="mt-2 flex gap-4">
        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold ${step >= 2 ? "border-[#2fb2a8] bg-[#2fb2a8] text-white" : "border-gray-300 text-gray-500"}`}>
          2
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-medium text-[#0E0E0E]">Confirm import</p>
          <p className="text-sm text-gray-600">Review and confirm your locations</p>
        </div>
      </div>

      {/* Main card */}
      <div className="mt-8 rounded-xl border border-gray-200 bg-white overflow-hidden">
        <div className="grid md:grid-cols-2">
          {/* Left: column spec */}
          <div className="border-b border-gray-200 p-6 md:border-b-0 md:border-r md:border-gray-200">
            <h2 className="font-semibold text-[#0E0E0E]">Please create a file containing 10 columns with these items in this order:</h2>
            <ul className="mt-4 space-y-2 text-sm text-gray-700">
              {CSV_COLUMNS.map((col) => (
                <li key={col.key} className="flex items-start gap-2">
                  <span className={col.required ? "text-red-500" : "text-gray-400"}>
                    {col.required ? "*" : " "}
                  </span>
                  <span className="font-medium">{col.label}</span>
                  {col.required && <span className="text-red-500" title="Required">ⓘ</span>}
                  <span className="text-gray-500">e.g. &quot;{col.example}&quot;</span>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-gray-500">* required</p>
          </div>

          {/* Right: upload (step 1) or summary (step 2) */}
          <div className="p-6">
            {step === 1 ? (
              <>
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  className={`flex flex-col items-center justify-center rounded-lg border-2 border-dashed py-12 px-6 transition-colors ${
                    dragActive ? "border-[#2fb2a8] bg-[#E0F7F5]/30" : "border-gray-300 bg-gray-50/50"
                  }`}
                >
                  <CloudUpload size={40} className="text-gray-400" />
                  <p className="mt-3 text-sm font-medium text-[#0E0E0E]">Drag and drop your CSV file here</p>
                  <p className="mt-1 text-sm text-gray-500">Or browse files</p>
                  <input
                    type="file"
                    accept=".csv"
                    className="mt-3 cursor-pointer text-sm file:mr-2 file:rounded-lg file:border-0 file:bg-[#2fb2a8] file:px-4 file:py-2 file:text-white file:hover:bg-[#269a91]"
                    onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
                  />
                </div>
                <p className="mt-3 text-right text-xs text-gray-500">
                  Note: Please don&apos;t import more than {MAX_LOCATIONS} locations at once.
                </p>
              </>
            ) : (
              <div>
                <p className="text-sm text-gray-700">
                  <strong>{parsed.length}</strong> location(s) ready to import.
                  {validationErrors.length > 0 && (
                    <span className="mt-2 block text-amber-700">
                      {validationErrors.length} validation warning(s) — only rows with all required fields are imported.
                    </span>
                  )}
                </p>
                {validationErrors.length > 0 && (
                  <ul className="mt-2 max-h-32 overflow-y-auto text-xs text-amber-700">
                    {validationErrors.slice(0, 10).map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                    {validationErrors.length > 10 && <li>… and {validationErrors.length - 10} more</li>}
                  </ul>
                )}
                <div className="mt-4 max-h-60 overflow-auto rounded border border-gray-200">
                  <table className="w-full text-left text-sm">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        <th className="border-b border-gray-200 px-3 py-2 font-medium">Location name</th>
                        <th className="border-b border-gray-200 px-3 py-2 font-medium">ID</th>
                        <th className="border-b border-gray-200 px-3 py-2 font-medium">City</th>
                        <th className="border-b border-gray-200 px-3 py-2 font-medium">Country</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.slice(0, 20).map((row, i) => (
                        <tr key={i} className="border-b border-gray-100">
                          <td className="px-3 py-2">{row.location_name}</td>
                          <td className="px-3 py-2">{row.id}</td>
                          <td className="px-3 py-2">{row.city}</td>
                          <td className="px-3 py-2">{row.country_code}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsed.length > 20 && <p className="px-3 py-2 text-xs text-gray-500">… and {parsed.length - 20} more rows</p>}
                </div>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setFile(null);
                      setParsed([]);
                      setValidationErrors([]);
                    }}
                    className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Choose another file
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmImport}
                    disabled={importing || parsed.length === 0}
                    className="rounded-lg bg-[#2fb2a8] px-4 py-2 text-sm font-semibold text-white hover:bg-[#269a91] disabled:opacity-50"
                  >
                    {importing ? "Importing…" : "Confirm import"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Help */}
      <div className="mt-6 flex items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/50 p-4">
        <Lightbulb size={20} className="shrink-0 text-amber-500" />
        <p className="text-sm text-gray-700">
          Not sure how the file should look?{" "}
          <button type="button" onClick={handleDownloadExample} className="font-medium text-[#124541] hover:underline">
            See the example &amp; instructions
          </button>
          {" "}(downloads a sample CSV).
        </p>
      </div>

      <div className="mt-4">
        <Link href={locationsHref} className="text-sm font-medium text-[#124541] hover:underline">
          ← Back to Locations
        </Link>
      </div>
    </div>
  );
}

const CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789@#$";

export function generatePassword(length = 10): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => CHARS[b % CHARS.length]).join("");
}

export function nextUserId(
  role: "teacher" | "student",
  existingIds: string[],
): string {
  const prefix = role === "teacher" ? "MPS-TCH-" : "MPS-STD-";
  const numbers = existingIds
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number.parseInt(id.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));

  const next = (numbers.length ? Math.max(...numbers) : 100) + 1;
  return `${prefix}${String(next).padStart(3, "0")}`;
}

export function nextReceiptSerial(existingSerials: string[]): string {
  const year = new Date().getFullYear();
  const prefix = `MPS-RCP-${year}-`;
  const numbers = existingSerials
    .filter((s) => s.startsWith(prefix))
    .map((s) => Number.parseInt(s.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));

  const next = (numbers.length ? Math.max(...numbers) : 0) + 1;
  return `${prefix}${String(next).padStart(4, "0")}`;
}

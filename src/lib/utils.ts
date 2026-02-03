type ClassValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ClassValue[]
  | { [key: string]: boolean };

export function cn(...classes: ClassValue[]): string {
  const result: string[] = [];

  const pushClass = (value: ClassValue) => {
    if (!value) {
      return;
    }

    if (typeof value === "string" || typeof value === "number") {
      result.push(String(value));
      return;
    }

    if (Array.isArray(value)) {
      value.forEach(pushClass);
      return;
    }

    if (typeof value === "object") {
      Object.entries(value).forEach(([key, enabled]) => {
        if (enabled) {
          result.push(key);
        }
      });
    }
  };

  classes.forEach(pushClass);

  return result.join(" ");
}

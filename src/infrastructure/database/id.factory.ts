import { randomUUID } from "crypto";

export function makeId(): string {
  return randomUUID();
}

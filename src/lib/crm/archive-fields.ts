import { normalizeKind, type ArchiveInput } from "./archive";
import { toKopecks } from "./format";

const str = (v: unknown) => {
  const s = v == null ? "" : String(v).trim();
  return s ? s : null;
};
const id = (v: unknown) => (v != null && v !== "" && Number(v) > 0 ? Number(v) : null);

/** Общий разбор полей — и из multipart, и из JSON */
export function parseArchiveFields(get: (k: string) => unknown): Partial<ArchiveInput> {
  const amount = get("amount");
  const direction = str(get("direction"));
  return {
    kind: normalizeKind(get("kind")),
    title: str(get("title")) || undefined,
    doc_number: str(get("docNumber")),
    doc_date: str(get("docDate")),
    amount_kopecks: amount != null && amount !== "" ? toKopecks(amount as string | number) : null,
    direction: direction === "in" || direction === "out" ? direction : null,
    status: str(get("status")),
    contractor_id: id(get("contractorId")),
    order_id: id(get("orderId")),
    project_id: id(get("projectId")),
    summary: str(get("summary")),
    content_text: str(get("contentText")),
    tags: str(get("tags")),
  };
}


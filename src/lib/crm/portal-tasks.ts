import { NextRequest, NextResponse } from "next/server";
import { checkPortalPassword, getContractorByPortalSlug, getCrmDb, logActivity, type Contractor } from "./db";
import { checkLoginAllowed, clientKey, registerLoginFailure, resetLoginFailures } from "./rate-limit";

/**
 * Задачи в портале контрагента: общий список дел с ним («отправить акт
 * по ДШИ»), файлы к задаче и отметка «выполнено» с датой. Это те же
 * строки tasks, что и в админке (contractor_id = контрагент) — галочка
 * в портале видна в CRM, и наоборот.
 */

export type PortalTaskFile = {
  id: number;
  title: string;
  original_name: string | null;
  mime_type: string | null;
  size_bytes: number | null;
  created_by: string | null;
  created_at: string;
};

export type PortalTask = {
  id: number;
  title: string;
  description: string | null;
  status: "open" | "done";
  due_at: string | null;
  created_by: string | null;
  created_at: string;
  done_at: string | null;
  files: PortalTaskFile[];
};

export function getPortalTasks(contractorId: number): PortalTask[] {
  const db = getCrmDb();
  const tasks = db
    .prepare(
      `SELECT id, title, description, status, due_at, created_by, created_at, done_at
       FROM tasks WHERE contractor_id = ?
       ORDER BY status = 'done', COALESCE(done_at, created_at) DESC`,
    )
    .all(contractorId) as Omit<PortalTask, "files">[];
  if (!tasks.length) return [];
  const files = db
    .prepare(
      `SELECT id, task_id, title, original_name, mime_type, size_bytes, created_by, created_at
       FROM archive_documents WHERE task_id IN (${tasks.map(() => "?").join(",")}) AND filename IS NOT NULL
       ORDER BY created_at`,
    )
    .all(...tasks.map((t) => t.id)) as (PortalTaskFile & { task_id: number })[];
  return tasks.map((t) => ({ ...t, files: files.filter((f) => f.task_id === t.id).map(({ task_id: _t, ...f }) => f) }));
}

export function getContractorTask(contractorId: number, taskId: number) {
  return getCrmDb()
    .prepare(`SELECT * FROM tasks WHERE id = ? AND contractor_id = ?`)
    .get(taskId, contractorId) as { id: number; title: string; status: string } | undefined;
}

export function setTaskDone(taskId: number, done: boolean, actor: string, contractorId: number) {
  const db = getCrmDb();
  db.prepare(
    done
      ? `UPDATE tasks SET status = 'done', done_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`
      : `UPDATE tasks SET status = 'open', done_at = NULL, updated_at = datetime('now') WHERE id = ?`,
  ).run(taskId);
  const t = db.prepare(`SELECT title FROM tasks WHERE id = ?`).get(taskId) as { title: string };
  logActivity("contractor", contractorId, done ? "task_done" : "task_reopened",
    `${done ? "Выполнена" : "Снова открыта"} задача «${t.title}»`, actor);
}

/**
 * Пароль приходит заголовком x-portal-password на каждый запрос — у портала
 * нет сессии (см. /api/portal/[slug]). Ошибки считаются тем же лимитом,
 * что и вход, чтобы пароль нельзя было перебирать через эти роуты.
 */
export function authPortal(
  request: NextRequest,
  slug: string,
): { contractor: Contractor; error?: undefined } | { contractor?: undefined; error: NextResponse } {
  const contractor = getContractorByPortalSlug(slug);
  if (!contractor) return { error: NextResponse.json({ error: "Не найдено" }, { status: 404 }) };
  const key = `portal:${slug}:${clientKey(request.headers)}`;
  const verdict = checkLoginAllowed(key);
  if (!verdict.allowed) {
    return { error: NextResponse.json({ error: "Слишком много попыток" }, { status: 429 }) };
  }
  const password = request.headers.get("x-portal-password") || "";
  if (!checkPortalPassword(contractor, password)) {
    registerLoginFailure(key);
    return { error: NextResponse.json({ error: "Неверный пароль" }, { status: 401 }) };
  }
  resetLoginFailures(key);
  return { contractor };
}

export const portalActor = (c: Contractor) => `portal:${c.portal_slug}`;

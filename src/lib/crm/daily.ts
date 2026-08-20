import { createTask, getCrmDb } from "./db";

/**
 * Итог дня.
 *
 * Факты дня не хранятся — они считаются из уже записанных данных. Хранится
 * только то, чего в данных нет: что об этом дне думаешь и какие выводы сделал.
 *
 * Смысл вывода не в том, чтобы его записать, а в том, чтобы к нему вернуться.
 * Поэтому вывод либо превращается в задачу, либо остаётся открытым и висит
 * перед глазами, пока не закроешь.
 */

export type DayMoney = {
  inKopecks: number;
  outKopecks: number;
  items: { id: number; direction: string; amountKopecks: number; comment: string | null; who: string | null }[];
};

export type DayDigest = {
  day: string;
  money: DayMoney;
  tasksDone: { id: number; title: string }[];
  tasksCreated: number;
  commitmentsDone: { id: number; title: string }[];
  events: { message: string; entityType: string; entityId: number }[];
  /** Что осталось незакрытым на конец дня */
  tasksOpenOverdue: number;
  commitmentsOverdue: number;
};

export type DayConclusion = {
  id: number;
  day: string;
  text: string;
  status: "open" | "done";
  task_id: number | null;
  created_at: string;
};

export type DayReport = {
  digest: DayDigest;
  reflection: string;
  conclusions: DayConclusion[];
  /** Выводы прошлых дней, к которым так и не вернулись */
  openFromBefore: DayConclusion[];
};

export function todayMsk(): string {
  return new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

function getDigest(day: string): DayDigest {
  const db = getCrmDb();

  const payments = db
    .prepare(
      `SELECT p.id, p.direction, p.amount_kopecks AS amountKopecks, p.comment,
              COALESCE(c.name, ec.name) AS who
       FROM payments p
       LEFT JOIN contractors c ON c.id = p.contractor_id
       LEFT JOIN expense_categories ec ON ec.id = p.category_id
       WHERE date(p.paid_at) = date(?)
       ORDER BY p.id`,
    )
    .all(day) as DayMoney["items"];

  const tasksDone = db
    .prepare(`SELECT id, title FROM tasks WHERE date(done_at) = date(?) ORDER BY id`)
    .all(day) as { id: number; title: string }[];

  const tasksCreated = (
    db.prepare(`SELECT COUNT(*) AS n FROM tasks WHERE date(created_at) = date(?)`).get(day) as { n: number }
  ).n;

  const commitmentsDone = db
    .prepare(`SELECT id, title FROM commitments WHERE date(done_at) = date(?) ORDER BY id`)
    .all(day) as { id: number; title: string }[];

  // Из журнала берём только содержательное: платежи и создание записей
  // и так видны выше, дубли в списке событий не нужны
  const events = db
    .prepare(
      `SELECT message, entity_type AS entityType, entity_id AS entityId
       FROM activity_log
       WHERE date(created_at) = date(?) AND event NOT IN ('payment_recorded')
       ORDER BY id`,
    )
    .all(day) as DayDigest["events"];

  const tasksOpenOverdue = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM tasks
         WHERE status = 'open' AND due_at IS NOT NULL AND date(due_at) <= date(?)`,
      )
      .get(day) as { n: number }
  ).n;

  const commitmentsOverdue = (
    db
      .prepare(
        `SELECT COUNT(*) AS n FROM commitments
         WHERE status = 'open' AND due_date IS NOT NULL AND date(due_date) <= date(?)`,
      )
      .get(day) as { n: number }
  ).n;

  return {
    day,
    money: {
      inKopecks: payments.filter((p) => p.direction === "in").reduce((s, p) => s + p.amountKopecks, 0),
      outKopecks: payments.filter((p) => p.direction === "out").reduce((s, p) => s + p.amountKopecks, 0),
      items: payments,
    },
    tasksDone,
    tasksCreated,
    commitmentsDone,
    events,
    tasksOpenOverdue,
    commitmentsOverdue,
  };
}

export function getDayReport(day: string): DayReport {
  const db = getCrmDb();

  const note = db.prepare(`SELECT reflection FROM day_notes WHERE day = ?`).get(day) as
    | { reflection: string | null }
    | undefined;

  const conclusions = db
    .prepare(`SELECT * FROM day_conclusions WHERE day = ? ORDER BY id`)
    .all(day) as DayConclusion[];

  const openFromBefore = db
    .prepare(`SELECT * FROM day_conclusions WHERE day < ? AND status = 'open' ORDER BY day DESC, id DESC LIMIT 10`)
    .all(day) as DayConclusion[];

  return {
    digest: getDigest(day),
    reflection: note?.reflection ?? "",
    conclusions,
    openFromBefore,
  };
}

export function saveReflection(day: string, reflection: string): void {
  const db = getCrmDb();
  db.prepare(
    `INSERT INTO day_notes (day, reflection) VALUES (?, ?)
     ON CONFLICT(day) DO UPDATE SET reflection = excluded.reflection, updated_at = datetime('now')`,
  ).run(day, reflection);
}

export function addConclusion(day: string, text: string): DayConclusion {
  const db = getCrmDb();
  return db
    .prepare(`INSERT INTO day_conclusions (day, text) VALUES (?, ?) RETURNING *`)
    .get(day, text) as DayConclusion;
}

/**
 * Превратить вывод в задачу. Это и есть «интеграция в работу»: пока вывод
 * лежит текстом, он ни на что не влияет.
 */
export function conclusionToTask(id: number, actor?: string): number | undefined {
  const db = getCrmDb();
  const c = db.prepare(`SELECT * FROM day_conclusions WHERE id = ?`).get(id) as DayConclusion | undefined;
  if (!c || c.task_id) return c?.task_id ?? undefined;

  const task = createTask(
    { title: c.text, description: `Вывод по итогам дня ${c.day}` },
    actor,
  );
  db.prepare(
    `UPDATE day_conclusions SET task_id = ?, status = 'done', closed_at = datetime('now') WHERE id = ?`,
  ).run(task.id, id);
  return task.id;
}

export function closeConclusion(id: number): void {
  const db = getCrmDb();
  db.prepare(`UPDATE day_conclusions SET status = 'done', closed_at = datetime('now') WHERE id = ?`).run(id);
}

export function deleteConclusion(id: number): void {
  const db = getCrmDb();
  db.prepare(`DELETE FROM day_conclusions WHERE id = ?`).run(id);
}

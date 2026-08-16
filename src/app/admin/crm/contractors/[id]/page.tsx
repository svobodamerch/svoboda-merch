"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

type Contractor = {
  id: number;
  type: string;
  name: string;
  company: string | null;
  inn: string | null;
  phone: string | null;
  telegram: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
};
type Order = { id: number; title: string; status: string; amount_kopecks: number; created_at: string };
type Payment = {
  id: number;
  direction: "in" | "out";
  amount_kopecks: number;
  comment: string | null;
  paid_at: string;
};
type ContractorService = {
  id: number;
  title: string;
  description: string | null;
  cost_kopecks: number;
  sell_price_kopecks: number | null;
  lead_time: string | null;
  notes: string | null;
};
type ActivityEntry = { id: number; message: string; actor: string | null; created_at: string };

type Detail = {
  contractor: Contractor;
  balanceKopecks: number;
  orders: Order[];
  payments: Payment[];
  services: ContractorService[];
  activity: ActivityEntry[];
};

function money(kopecks: number): string {
  return `${(kopecks / 100).toLocaleString("ru-RU", { maximumFractionDigits: 2 })} ₽`;
}

const field =
  "w-full rounded-xl border border-line bg-bg px-4 py-3 text-[13px] text-ink outline-none focus:border-accent";

export default function ContractorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<Detail | null>(null);
  const [orderForm, setOrderForm] = useState({ title: "", amount: "", description: "" });
  const [paymentForm, setPaymentForm] = useState({ direction: "in", amount: "", comment: "" });
  const [contactForm, setContactForm] = useState({
    company: "",
    inn: "",
    phone: "",
    telegram: "",
    email: "",
    address: "",
    notes: "",
  });
  const [editingContact, setEditingContact] = useState(false);
  const [serviceForm, setServiceForm] = useState({
    title: "",
    cost: "",
    sellPrice: "",
    leadTime: "",
    notes: "",
  });
  const [showServiceForm, setShowServiceForm] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = () => {
    fetch(`/api/crm/contractors/${id}`)
      .then((r) => r.json())
      .then((d: Detail) => {
        setData(d);
        setContactForm({
          company: d.contractor.company || "",
          inn: d.contractor.inn || "",
          phone: d.contractor.phone || "",
          telegram: d.contractor.telegram || "",
          email: d.contractor.email || "",
          address: d.contractor.address || "",
          notes: d.contractor.notes || "",
        });
      });
  };

  useEffect(load, [id]);

  const submitOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (!orderForm.title.trim()) return;
    setSaving(true);
    await fetch("/api/crm/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...orderForm, contractorId: Number(id) }),
    });
    setOrderForm({ title: "", amount: "", description: "" });
    setSaving(false);
    load();
  };

  const submitPayment = async (e: FormEvent) => {
    e.preventDefault();
    if (!paymentForm.amount) return;
    setSaving(true);
    await fetch("/api/crm/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...paymentForm, contractorId: Number(id) }),
    });
    setPaymentForm({ direction: "in", amount: "", comment: "" });
    setSaving(false);
    load();
  };

  const submitContact = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/crm/contractors/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(contactForm),
    });
    setSaving(false);
    setEditingContact(false);
    load();
  };

  const submitService = async (e: FormEvent) => {
    e.preventDefault();
    if (!serviceForm.title.trim()) return;
    setSaving(true);
    await fetch(`/api/crm/contractors/${id}/services`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(serviceForm),
    });
    setServiceForm({ title: "", cost: "", sellPrice: "", leadTime: "", notes: "" });
    setShowServiceForm(false);
    setSaving(false);
    load();
  };

  const deleteService = async (serviceId: number) => {
    await fetch(`/api/crm/services/${serviceId}`, { method: "DELETE" });
    load();
  };

  if (!data) return <p className="label text-muted">Загрузка…</p>;
  const { contractor, balanceKopecks, orders, payments, services, activity } = data;

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin/crm/contractors" className="label text-muted hover:text-ink">
          ← Контрагенты
        </Link>
        <p className="label-lg text-ink mt-2">{contractor.name}</p>
        <p className={`label mt-2 ${balanceKopecks > 0 ? "text-accent" : "text-ink-soft"}`}>
          {balanceKopecks > 0
            ? `Должен нам: ${money(balanceKopecks)}`
            : balanceKopecks < 0
              ? `Должны ему: ${money(-balanceKopecks)}`
              : "Баланс закрыт"}
        </p>
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="label text-accent">Контакты и адрес</p>
          <button
            type="button"
            onClick={() => setEditingContact((v) => !v)}
            className="label text-accent"
          >
            {editingContact ? "Отмена" : "Изменить"}
          </button>
        </div>

        {editingContact ? (
          <form onSubmit={submitContact} className="grid gap-3 rounded-2xl bg-surface p-5 sm:grid-cols-2">
            <input
              className={field}
              placeholder="Компания"
              value={contactForm.company}
              onChange={(e) => setContactForm((f) => ({ ...f, company: e.target.value }))}
            />
            <input
              className={field}
              placeholder="ИНН"
              value={contactForm.inn}
              onChange={(e) => setContactForm((f) => ({ ...f, inn: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Телефон"
              value={contactForm.phone}
              onChange={(e) => setContactForm((f) => ({ ...f, phone: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Телеграм"
              value={contactForm.telegram}
              onChange={(e) => setContactForm((f) => ({ ...f, telegram: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Email"
              value={contactForm.email}
              onChange={(e) => setContactForm((f) => ({ ...f, email: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Адрес"
              value={contactForm.address}
              onChange={(e) => setContactForm((f) => ({ ...f, address: e.target.value }))}
            />
            <textarea
              className={`${field} resize-none sm:col-span-2`}
              rows={3}
              placeholder="Комментарий"
              value={contactForm.notes}
              onChange={(e) => setContactForm((f) => ({ ...f, notes: e.target.value }))}
            />
            <button
              type="submit"
              disabled={saving}
              className="pill label bg-accent text-bg hover:bg-accent-soft sm:col-span-2"
            >
              Сохранить
            </button>
          </form>
        ) : (
          <div className="rounded-2xl bg-surface p-5">
            <p className="label text-ink">
              {[contractor.company, contractor.phone, contractor.telegram, contractor.email]
                .filter(Boolean)
                .join(" · ") || "Контакты не указаны"}
            </p>
            {contractor.address && <p className="label text-ink-soft mt-2">{contractor.address}</p>}
            {contractor.notes && <p className="label text-muted mt-2 whitespace-pre-line">{contractor.notes}</p>}
          </div>
        )}
      </div>

      <div>
        <div className="mb-4 flex items-center justify-between">
          <p className="label text-accent">Работы — что делает и экономика</p>
          <button
            type="button"
            onClick={() => setShowServiceForm((v) => !v)}
            className="label text-accent"
          >
            {showServiceForm ? "Отмена" : "+ работа"}
          </button>
        </div>

        {showServiceForm && (
          <form onSubmit={submitService} className="mb-4 grid gap-2 rounded-2xl bg-surface p-5 sm:grid-cols-2">
            <input
              className={`${field} sm:col-span-2`}
              placeholder="Название работы *"
              value={serviceForm.title}
              onChange={(e) => setServiceForm((f) => ({ ...f, title: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Платим ей, ₽"
              inputMode="decimal"
              value={serviceForm.cost}
              onChange={(e) => setServiceForm((f) => ({ ...f, cost: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Продаём за, ₽"
              inputMode="decimal"
              value={serviceForm.sellPrice}
              onChange={(e) => setServiceForm((f) => ({ ...f, sellPrice: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Срок"
              value={serviceForm.leadTime}
              onChange={(e) => setServiceForm((f) => ({ ...f, leadTime: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Заметка"
              value={serviceForm.notes}
              onChange={(e) => setServiceForm((f) => ({ ...f, notes: e.target.value }))}
            />
            <button
              type="submit"
              disabled={saving || !serviceForm.title.trim()}
              className="pill label bg-accent text-bg hover:bg-accent-soft sm:col-span-2"
            >
              Добавить
            </button>
          </form>
        )}

        <ul className="divide-y divide-line border-t border-line">
          {services.map((s) => {
            const margin =
              s.sell_price_kopecks != null ? s.sell_price_kopecks - s.cost_kopecks : null;
            return (
              <li key={s.id} className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="label text-ink">{s.title}</p>
                    <p className="label text-muted mt-1">
                      Платим {money(s.cost_kopecks)}
                      {s.sell_price_kopecks != null && ` · Продаём ${money(s.sell_price_kopecks)}`}
                      {margin != null && ` · Маржа ${money(margin)}`}
                      {s.lead_time && ` · Срок: ${s.lead_time}`}
                    </p>
                    {s.notes && <p className="label text-muted mt-1">{s.notes}</p>}
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteService(s.id)}
                    className="label text-muted hover:text-accent shrink-0"
                  >
                    Убрать
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
        {services.length === 0 && <p className="label text-muted">Работы пока не заведены</p>}
      </div>

      <div className="grid gap-8 sm:grid-cols-2">
        <div>
          <p className="label text-accent mb-4">Заказы</p>
          <form onSubmit={submitOrder} className="mb-4 space-y-2 rounded-2xl bg-surface p-5">
            <input
              className={field}
              placeholder="Название заказа *"
              value={orderForm.title}
              onChange={(e) => setOrderForm((f) => ({ ...f, title: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Сумма, ₽"
              inputMode="decimal"
              value={orderForm.amount}
              onChange={(e) => setOrderForm((f) => ({ ...f, amount: e.target.value }))}
            />
            <textarea
              className={`${field} resize-none`}
              rows={2}
              placeholder="Описание"
              value={orderForm.description}
              onChange={(e) => setOrderForm((f) => ({ ...f, description: e.target.value }))}
            />
            <button
              type="submit"
              disabled={saving || !orderForm.title.trim()}
              className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
            >
              Добавить заказ
            </button>
          </form>

          <ul className="divide-y divide-line border-t border-line">
            {orders.map((o) => (
              <li key={o.id}>
                <Link
                  href={`/admin/crm/orders/${o.id}`}
                  className="flex items-center justify-between py-3 hover:bg-surface"
                >
                  <span className="label text-ink">{o.title}</span>
                  <span className="label text-muted">{money(o.amount_kopecks)}</span>
                </Link>
              </li>
            ))}
          </ul>
          {orders.length === 0 && <p className="label text-muted">Заказов нет</p>}
        </div>

        <div>
          <p className="label text-accent mb-4">Платежи</p>
          <form onSubmit={submitPayment} className="mb-4 space-y-2 rounded-2xl bg-surface p-5">
            <select
              className={field}
              value={paymentForm.direction}
              onChange={(e) => setPaymentForm((f) => ({ ...f, direction: e.target.value }))}
            >
              <option value="in">Нам заплатили</option>
              <option value="out">Мы заплатили</option>
            </select>
            <input
              className={field}
              placeholder="Сумма, ₽ *"
              inputMode="decimal"
              value={paymentForm.amount}
              onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Комментарий"
              value={paymentForm.comment}
              onChange={(e) => setPaymentForm((f) => ({ ...f, comment: e.target.value }))}
            />
            <button
              type="submit"
              disabled={saving || !paymentForm.amount}
              className="pill label bg-accent text-bg hover:bg-accent-soft disabled:bg-line disabled:text-muted"
            >
              Записать платёж
            </button>
          </form>

          <ul className="divide-y divide-line border-t border-line">
            {payments.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-3">
                <span className="label text-ink">{p.comment || (p.direction === "in" ? "Оплата" : "Расход")}</span>
                <span className={`label ${p.direction === "in" ? "text-accent" : "text-ink-soft"}`}>
                  {p.direction === "in" ? "+" : "−"}
                  {money(p.amount_kopecks)}
                </span>
              </li>
            ))}
          </ul>
          {payments.length === 0 && <p className="label text-muted">Платежей нет</p>}
        </div>
      </div>

      <div>
        <p className="label text-accent mb-4">Журнал</p>
        <ul className="divide-y divide-line border-t border-line">
          {activity.map((a) => (
            <li key={a.id} className="flex items-center justify-between py-3">
              <span className="label text-ink">{a.message}</span>
              <span className="label text-muted">{new Date(a.created_at).toLocaleString("ru-RU")}</span>
            </li>
          ))}
        </ul>
        {activity.length === 0 && <p className="label text-muted">Пока пусто</p>}
      </div>
    </div>
  );
}

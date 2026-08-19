"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { ContractorContacts } from "./ContractorContacts";
import { PortalLink } from "./PortalLink";
import { ContractorBalanceBlock } from "./ContractorBalanceBlock";
import type { ContractorBalance } from "@/lib/crm/reconciliation";

type Contractor = {
  id: number;
  type: string;
  name: string;
  company: string | null;
  inn: string | null;
  kpp: string | null;
  ogrn: string | null;
  legal_address: string | null;
  actual_address: string | null;
  bank_name: string | null;
  bank_account: string | null;
  bank_bik: string | null;
  bank_corr_account: string | null;
  contract_number: string | null;
  contract_date: string | null;
  contract_basis: string | null;
  phone: string | null;
  telegram: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  portal_slug: string | null;
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
  balance: ContractorBalance;
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
    kpp: "",
    ogrn: "",
    legalAddress: "",
    actualAddress: "",
    bankName: "",
    bankAccount: "",
    bankBik: "",
    bankCorrAccount: "",
    contractNumber: "",
    contractDate: "",
    contractBasis: "",
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
          kpp: d.contractor.kpp || "",
          ogrn: d.contractor.ogrn || "",
          legalAddress: d.contractor.legal_address || "",
          actualAddress: d.contractor.actual_address || "",
          bankName: d.contractor.bank_name || "",
          bankAccount: d.contractor.bank_account || "",
          bankBik: d.contractor.bank_bik || "",
          bankCorrAccount: d.contractor.bank_corr_account || "",
          contractNumber: d.contractor.contract_number || "",
          contractDate: d.contractor.contract_date || "",
          contractBasis: d.contractor.contract_basis || "",
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
  const { contractor, balance, orders, payments, services, activity } = data;

  return (
    <div className="space-y-10">
      <div>
        <Link href="/admin/crm/contractors" className="label text-muted hover:text-ink">
          ← Контрагенты
        </Link>
        <p className="label-lg text-ink mt-2">{contractor.name}</p>
        <ContractorBalanceBlock balance={balance} contractorId={String(id)} onChanged={load} />
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
              placeholder="КПП"
              value={contactForm.kpp}
              onChange={(e) => setContactForm((f) => ({ ...f, kpp: e.target.value }))}
            />
            <input
              className={field}
              placeholder="ОГРН / ОГРНИП"
              value={contactForm.ogrn}
              onChange={(e) => setContactForm((f) => ({ ...f, ogrn: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Юридический адрес"
              value={contactForm.legalAddress}
              onChange={(e) => setContactForm((f) => ({ ...f, legalAddress: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Фактический адрес"
              value={contactForm.actualAddress}
              onChange={(e) => setContactForm((f) => ({ ...f, actualAddress: e.target.value }))}
            />
            <input
              className={`${field} sm:col-span-2`}
              placeholder="Банк"
              value={contactForm.bankName}
              onChange={(e) => setContactForm((f) => ({ ...f, bankName: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Расчётный счёт"
              value={contactForm.bankAccount}
              onChange={(e) => setContactForm((f) => ({ ...f, bankAccount: e.target.value }))}
            />
            <input
              className={field}
              placeholder="БИК"
              value={contactForm.bankBik}
              onChange={(e) => setContactForm((f) => ({ ...f, bankBik: e.target.value }))}
            />
            <input
              className={`${field} sm:col-span-2`}
              placeholder="Корр. счёт"
              value={contactForm.bankCorrAccount}
              onChange={(e) => setContactForm((f) => ({ ...f, bankCorrAccount: e.target.value }))}
            />
            <input
              className={field}
              placeholder="№ договора"
              value={contactForm.contractNumber}
              onChange={(e) => setContactForm((f) => ({ ...f, contractNumber: e.target.value }))}
            />
            <input
              className={field}
              placeholder="Дата договора"
              type="date"
              value={contactForm.contractDate}
              onChange={(e) => setContactForm((f) => ({ ...f, contractDate: e.target.value }))}
            />
            <input
              className={`${field} sm:col-span-2`}
              placeholder="Основание (например «Договор поставки от…»)"
              value={contactForm.contractBasis}
              onChange={(e) => setContactForm((f) => ({ ...f, contractBasis: e.target.value }))}
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
            {(contractor.legal_address || contractor.actual_address || contractor.address) && (
              <p className="label text-ink-soft mt-2">
                {contractor.legal_address || contractor.address}
                {contractor.actual_address && contractor.actual_address !== contractor.legal_address
                  ? ` · факт: ${contractor.actual_address}`
                  : ""}
              </p>
            )}
            {(contractor.kpp || contractor.ogrn) && (
              <p className="label text-muted mt-2">
                {[contractor.kpp && `КПП ${contractor.kpp}`, contractor.ogrn && `ОГРН ${contractor.ogrn}`]
                  .filter(Boolean)
                  .join(" · ")}
              </p>
            )}
            {contractor.bank_account && (
              <p className="label text-muted mt-1">
                {contractor.bank_name ? `${contractor.bank_name} · ` : ""}
                р/с {contractor.bank_account}
                {contractor.bank_bik ? ` · БИК ${contractor.bank_bik}` : ""}
                {contractor.bank_corr_account ? ` · к/с ${contractor.bank_corr_account}` : ""}
              </p>
            )}
            {(contractor.contract_number || contractor.contract_basis) && (
              <p className="label text-muted mt-1">
                {contractor.contract_basis ||
                  `Договор №${contractor.contract_number}${contractor.contract_date ? ` от ${contractor.contract_date}` : ""}`}
              </p>
            )}
            {contractor.notes && <p className="label text-muted mt-2 whitespace-pre-line">{contractor.notes}</p>}
          </div>
        )}
      </div>

      <PortalLink contractorId={String(id)} slug={contractor.portal_slug} />

      <ContractorContacts contractorId={String(id)} />

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
          <p className="label text-accent mb-4">Сделки</p>
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

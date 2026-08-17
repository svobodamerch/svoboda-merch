import { formatMoney } from "@/lib/crm/format";

/**
 * Печатный вид счёта/акта — общий для превью в админке и для того, что
 * уйдёт в PDF через печать браузера. Данные приходят уже расшифрованным
 * снимком реквизитов (supplier/buyer сохранены на момент выставления),
 * а не текущей карточкой юрлица/контрагента — так документ не «поплывёт»,
 * если реквизиты потом сменятся.
 */

type Bank = { bank_name: string | null; bik: string | null; corr_account: string | null; account_number: string | null };
type Supplier = { name: string; inn: string | null; kpp: string | null; address: string | null; signer: string | null; bank: Bank | null };
type Buyer = { name: string; inn: string | null; kpp: string | null; address: string | null; bank: Bank | null };

export type DocumentPrintItem = {
  title: string;
  quantity: number;
  unit: string;
  unit_price_kopecks: number;
  amount_kopecks: number;
};

export type DocumentPrintData = {
  docType: "invoice" | "act";
  number: string;
  docDate: string;
  totalKopecks: number;
  basis: string | null;
  supplier: Supplier;
  buyer: Buyer;
  items: DocumentPrintItem[];
};

function numberToWords(rubles: number): string {
  // Точная сумма прописью — редкий кейс промаха на печати; пока просто число словами не делаем,
  // используем ту же строку, что и в реальных счетах поставщиков — просуммированную цифрами.
  return `${rubles.toLocaleString("ru-RU", { maximumFractionDigits: 2 })} рублей`;
}

export function DocumentPrint({ data }: { data: DocumentPrintData }) {
  const { supplier, buyer, items } = data;
  const title = data.docType === "act" ? "Акт сдачи-приёмки" : "Счёт на оплату";
  const partyLabel = data.docType === "act" ? ["Исполнитель", "Заказчик"] : ["Получатель", "Плательщик"];

  return (
    <div className="mx-auto max-w-[780px] bg-bg px-2 py-6 text-ink sm:px-0">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-6">
        <div>
          <p className="label-lg text-ink">{supplier.name}</p>
          <p className="label text-muted">{partyLabel[0]}</p>
        </div>
        <div className="text-right">
          <p className="label-lg text-ink">{formatMoney(data.totalKopecks)}</p>
          <p className="label text-muted">Без НДС</p>
        </div>
      </div>

      {supplier.bank && (
        <div className="mt-4 grid grid-cols-[1fr_auto] gap-x-6 gap-y-1 rounded-xl bg-surface p-4 text-[13px]">
          <span className="text-ink-soft">{supplier.bank.bank_name}</span>
          <span className="text-right text-muted">БИК {supplier.bank.bik}</span>
          <span className="text-muted">Банк получателя</span>
          <span className="text-right text-muted">Кор. счёт {supplier.bank.corr_account}</span>
          <span className="text-ink-soft">ИНН {supplier.inn}{supplier.kpp ? ` КПП ${supplier.kpp}` : ""}</span>
          <span className="text-right text-muted">Счёт {supplier.bank.account_number}</span>
        </div>
      )}

      <h1 className="label-lg mt-8 text-ink" style={{ fontSize: "1.4rem" }}>
        {title} №{data.number} от {new Date(data.docDate).toLocaleDateString("ru-RU")}
      </h1>

      <div className="mt-6 space-y-3 text-[13px]">
        <p>
          <span className="label text-muted">{partyLabel[0]}: </span>
          <span className="text-ink-soft">
            {supplier.name}
            {supplier.inn ? `, ИНН ${supplier.inn}` : ""}
            {supplier.address ? `, ${supplier.address}` : ""}
            {supplier.bank
              ? `, р/с ${supplier.bank.account_number}, в банке ${supplier.bank.bank_name}, БИК ${supplier.bank.bik}, к/с ${supplier.bank.corr_account}`
              : ""}
          </span>
        </p>
        <p>
          <span className="label text-muted">{partyLabel[1]}: </span>
          <span className="text-ink-soft">
            {buyer.name}
            {buyer.inn ? `, ИНН${buyer.kpp ? "/КПП" : ""} ${buyer.inn}${buyer.kpp ? `/${buyer.kpp}` : ""}` : ""}
            {buyer.address ? `, ${buyer.address}` : ""}
            {buyer.bank
              ? `, р/с ${buyer.bank.account_number}, в банке ${buyer.bank.bank_name}, БИК ${buyer.bank.bik}`
              : ""}
          </span>
        </p>
        {data.basis && (
          <p>
            <span className="label text-muted">Основание: </span>
            <span className="text-ink-soft">{data.basis}</span>
          </p>
        )}
      </div>

      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[13px]">
          <thead>
            <tr className="border-b border-line">
              <th className="py-2 pr-2 font-normal text-muted">№</th>
              <th className="py-2 pr-4 font-normal text-muted">Название товара или услуги</th>
              <th className="py-2 pr-4 font-normal text-muted">Кол-во</th>
              <th className="py-2 pr-4 font-normal text-muted">Ед.</th>
              <th className="py-2 pr-4 text-right font-normal text-muted">Цена</th>
              <th className="py-2 text-right font-normal text-muted">Сумма</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={idx} className="border-b border-line">
                <td className="py-3 pr-2 text-muted">{idx + 1}</td>
                <td className="py-3 pr-4 text-ink">{item.title}</td>
                <td className="py-3 pr-4 text-ink-soft">{item.quantity}</td>
                <td className="py-3 pr-4 text-ink-soft">{item.unit}</td>
                <td className="py-3 pr-4 text-right text-ink-soft whitespace-nowrap">
                  {formatMoney(item.unit_price_kopecks)}
                </td>
                <td className="py-3 text-right text-ink whitespace-nowrap">{formatMoney(item.amount_kopecks)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex items-baseline justify-between">
        <p className="label text-muted">
          Всего {items.length === 1 ? "одно наименование" : `наименований: ${items.length}`} на сумму{" "}
          {numberToWords(data.totalKopecks / 100)} {(data.totalKopecks % 100).toString().padStart(2, "0")} копеек
        </p>
      </div>

      <div className="mt-2 flex items-baseline justify-between border-t border-ink pt-3">
        <span className="label-lg text-ink">{data.docType === "act" ? "Итого выполнено" : "Итого к оплате"}</span>
        <span className="label-lg text-ink">{formatMoney(data.totalKopecks)}</span>
      </div>

      {data.docType === "act" && (
        <p className="mt-6 text-[13px] text-ink-soft">
          Вышеперечисленные услуги (работы) выполнены полностью и в срок. Заказчик претензий по объёму, качеству и
          срокам оказания услуг (выполнения работ) не имеет.
        </p>
      )}

      <div className="mt-16 grid grid-cols-2 gap-8 text-[13px]">
        <div>
          <div className="mb-1 border-b border-ink pb-8" />
          <p className="text-ink-soft">{partyLabel[0]}{supplier.signer ? ` — ${supplier.signer}` : ""}</p>
        </div>
        <div>
          <div className="mb-1 border-b border-ink pb-8" />
          <p className="text-ink-soft">{partyLabel[1]} — {buyer.name}</p>
        </div>
      </div>
    </div>
  );
}

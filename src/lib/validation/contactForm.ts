export type ProductType = "одежда" | "аксессуары" | "печать" | "весь мерч";

export type ContactFormValues = {
  name: string;
  company: string;
  phone: string;
  productType: ProductType | "";
  quantity: string;
  comment: string;
  deadline: string;
};

export type ContactFormErrors = Partial<Record<keyof ContactFormValues, string>>;

export const PRODUCT_TYPES: { value: ProductType; label: string }[] = [
  { value: "одежда", label: "Одежда" },
  { value: "аксессуары", label: "Аксессуары" },
  { value: "печать", label: "Печать" },
  { value: "весь мерч", label: "Весь мерч" },
];

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 10 && digits.length <= 15;
}

export function validateContactForm(values: ContactFormValues): ContactFormErrors {
  const errors: ContactFormErrors = {};

  const name = values.name.trim();
  if (!name) {
    errors.name = "Укажите имя";
  } else if (name.length < 2) {
    errors.name = "Имя слишком короткое";
  }

  const phone = values.phone.trim();
  if (!phone) {
    errors.phone = "Укажите телефон";
  } else if (!isValidPhone(phone)) {
    errors.phone = "Введите корректный номер телефона";
  }

  if (!values.productType) {
    errors.productType = "Выберите тип продукции";
  }

  const quantityRaw = values.quantity.trim();
  if (!quantityRaw) {
    errors.quantity = "Укажите тираж";
  } else {
    const quantity = Number(quantityRaw);
    if (!Number.isFinite(quantity) || !Number.isInteger(quantity)) {
      errors.quantity = "Тираж должен быть целым числом";
    } else if (quantity < 1) {
      errors.quantity = "Укажите количество от 1";
    }
  }

  if (values.deadline) {
    const deadlineDate = new Date(values.deadline);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(deadlineDate.getTime())) {
      errors.deadline = "Некорректная дата";
    } else if (deadlineDate < today) {
      errors.deadline = "Дата не может быть в прошлом";
    }
  }

  return errors;
}

export const initialContactFormValues: ContactFormValues = {
  name: "",
  company: "",
  phone: "",
  productType: "",
  quantity: "",
  comment: "",
  deadline: "",
};

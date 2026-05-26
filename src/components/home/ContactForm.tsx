"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldControlClass, FormField } from "@/components/ui/FormField";
import {
  initialContactFormValues,
  PRODUCT_TYPES,
  validateContactForm,
  type ContactFormErrors,
  type ContactFormValues,
} from "@/lib/validation/contactForm";

const API_ENDPOINT = "/api/leads";

export function ContactForm() {
  const [values, setValues] = useState<ContactFormValues>(initialContactFormValues);
  const [errors, setErrors] = useState<ContactFormErrors>({});
  const [touched, setTouched] = useState<Partial<Record<keyof ContactFormValues, boolean>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateField = (field: keyof ContactFormValues, nextValues: ContactFormValues) => {
    const fieldErrors = validateContactForm(nextValues);
    setErrors((prev) => ({
      ...prev,
      [field]: fieldErrors[field],
    }));
  };

  const handleChange = (
    field: keyof ContactFormValues,
    value: string,
  ) => {
    const nextValues = { ...values, [field]: value };
    setValues(nextValues);
    setSubmitError(null);

    if (touched[field]) {
      validateField(field, nextValues);
    }
  };

  const handleBlur = (field: keyof ContactFormValues) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validateField(field, values);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitError(null);

    const validationErrors = validateContactForm(values);
    setErrors(validationErrors);
    setTouched({
      name: true,
      company: true,
      phone: true,
      productType: true,
      quantity: true,
      comment: true,
      deadline: true,
    });

    if (Object.keys(validationErrors).length > 0) {
      const firstErrorField = Object.keys(validationErrors)[0] as keyof ContactFormValues;
      document.getElementById(firstErrorField)?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: values.name.trim(),
          company: values.company.trim(),
          phone: values.phone.trim(),
          productType: values.productType,
          quantity: values.quantity.trim(),
          comment: values.comment.trim(),
          deadline: values.deadline,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || "Submit failed");
      }

      setIsSuccess(true);
      setValues(initialContactFormValues);
      setTouched({});
      setErrors({});
    } catch {
      setSubmitError(
        "Не удалось отправить заявку. Попробуйте ещё раз или напишите на mail@svoboda.site",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div
        className="border border-line bg-paper p-10 text-center md:p-14 rounded-3xl"
        role="status"
        aria-live="polite"
      >
        <div className="mx-auto flex h-14 w-14 items-center justify-center border border-accent/20 bg-accent/5">
          <span className="text-2xl text-accent" aria-hidden>
            ✓
          </span>
        </div>
        <h3 className="mt-6 font-heading text-2xl font-medium tracking-tight text-ink">
          Заявка отправлена
        </h3>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          Спасибо! Мы свяжемся с вами в течение 24 часов с идеей и расчётом.
        </p>
        <button
          type="button"
          onClick={() => setIsSuccess(false)}
          className="mt-8 text-sm font-medium text-accent transition-colors hover:text-accent/80"
        >
          Отправить ещё одну заявку
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      id="sample"
      className="rounded-3xl border border-line bg-paper p-6 md:p-10 lg:p-12"
    >
      <div className="grid gap-6 md:grid-cols-2 md:gap-x-8 md:gap-y-6">
        <FormField id="name" label="Имя" error={errors.name} required>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={(e) => handleChange("name", e.target.value)}
            onBlur={() => handleBlur("name")}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? "name-error" : undefined}
            className={fieldControlClass({ hasError: Boolean(errors.name) })}
            placeholder="Алексей"
          />
        </FormField>

        <FormField id="company" label="Компания" error={errors.company}>
          <input
            id="company"
            name="company"
            type="text"
            autoComplete="organization"
            value={values.company}
            onChange={(e) => handleChange("company", e.target.value)}
            onBlur={() => handleBlur("company")}
            className={fieldControlClass({ hasError: Boolean(errors.company) })}
            placeholder="Название компании или проекта"
          />
        </FormField>

        <FormField id="phone" label="Телефон" error={errors.phone} required>
          <input
            id="phone"
            name="phone"
            type="tel"
            autoComplete="tel"
            value={values.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            onBlur={() => handleBlur("phone")}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? "phone-error" : undefined}
            className={fieldControlClass({ hasError: Boolean(errors.phone) })}
            placeholder="+7 (999) 123-45-67"
          />
        </FormField>

        <FormField
          id="productType"
          label="Тип продукции"
          error={errors.productType}
          required
        >
          <select
            id="productType"
            name="productType"
            value={values.productType}
            onChange={(e) => handleChange("productType", e.target.value)}
            onBlur={() => handleBlur("productType")}
            aria-invalid={Boolean(errors.productType)}
            aria-describedby={errors.productType ? "productType-error" : undefined}
            className={`${fieldControlClass({ hasError: Boolean(errors.productType) })} appearance-none bg-[length:12px] bg-[right_1rem_center] bg-no-repeat pr-10`}
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%236b6b6b' d='M2 4l4 4 4-4'/%3E%3C/svg%3E")`,
            }}
          >
            <option value="" disabled>
              Выберите направление
            </option>
            {PRODUCT_TYPES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </FormField>

        <FormField
          id="quantity"
          label="Тираж"
          error={errors.quantity}
          required
        >
          <input
            id="quantity"
            name="quantity"
            type="number"
            min={1}
            step={1}
            value={values.quantity}
            onChange={(e) => handleChange("quantity", e.target.value)}
            onBlur={() => handleBlur("quantity")}
            aria-invalid={Boolean(errors.quantity)}
            aria-describedby={errors.quantity ? "quantity-error" : undefined}
            className={fieldControlClass({ hasError: Boolean(errors.quantity) })}
            placeholder="100"
          />
        </FormField>

        <FormField id="deadline" label="Сроки" error={errors.deadline}>
          <input
            id="deadline"
            name="deadline"
            type="date"
            value={values.deadline}
            onChange={(e) => handleChange("deadline", e.target.value)}
            onBlur={() => handleBlur("deadline")}
            aria-invalid={Boolean(errors.deadline)}
            className={fieldControlClass({ hasError: Boolean(errors.deadline) })}
          />
        </FormField>

        <div className="md:col-span-2">
          <FormField id="comment" label="Комментарий" error={errors.comment}>
            <textarea
              id="comment"
              name="comment"
              rows={4}
              value={values.comment}
              onChange={(e) => handleChange("comment", e.target.value)}
              onBlur={() => handleBlur("comment")}
              className={`${fieldControlClass({ hasError: Boolean(errors.comment) })} resize-none`}
              placeholder="Расскажите о бренде, идее, формате изделий или референсах"
            />
          </FormField>
        </div>
      </div>

      {submitError && (
        <p className="mt-6 border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {submitError}
        </p>
      )}

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-muted">
          Чем подробнее опишете задачу — тем точнее будет расчёт. Нажимая кнопку, вы
          соглашаетесь на обработку персональных данных.
        </p>
        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="shrink-0 disabled:pointer-events-none disabled:opacity-50"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Отправляем…" : "Получить расчёт"}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/Button";
import { fieldControlClass, FormField } from "@/components/ui/FormField";
import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

type FormValues = { name: string; email: string; phone: string };
type FormErrors = Partial<FormValues>;

function validate(values: FormValues): FormErrors {
  const errors: FormErrors = {};
  if (!values.name.trim()) errors.name = "Укажите имя";
  if (!values.email.trim()) {
    errors.email = "Укажите email";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Некорректный email";
  }
  const digits = values.phone.replace(/\D/g, "");
  if (!digits) errors.phone = "Укажите телефон";
  else if (digits.length < 10) errors.phone = "Введите корректный номер";
  return errors;
}

export function LeadMagnet() {
  const [values, setValues] = useState<FormValues>({
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSuccess(true);
  };

  return (
    <section id="guide" className="bg-ink py-16 text-paper md:py-24">
      <Container>
        <div className="mx-auto max-w-2xl text-center">
          <SectionHeading
            eyebrow="Бесплатно"
            title="Гайд: как заказать мерч, который носят"
            description="10 страниц про ткани, тиражи, сроки и типичные ошибки — без воды и рекламы типографий."
            align="center"
            dark
          />

          {success ? (
            <div className="mt-10 rounded-3xl bg-paper/10 p-8" role="status">
              <p className="font-heading text-xl font-medium">
                Гайд отправлен на {values.email}
              </p>
              <p className="mt-2 text-sm text-paper/70">
                Проверьте почту — письмо придёт в течение нескольких минут.
              </p>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              noValidate
              className="mt-10 space-y-4 text-left"
            >
              <FormField id="guide-name" label="Имя" error={errors.name} required>
                <input
                  id="guide-name"
                  value={values.name}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, name: e.target.value }))
                  }
                  className={fieldControlClass({ hasError: Boolean(errors.name) })}
                  placeholder="Алексей"
                />
              </FormField>
              <FormField id="guide-email" label="Email" error={errors.email} required>
                <input
                  id="guide-email"
                  type="email"
                  value={values.email}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, email: e.target.value }))
                  }
                  className={fieldControlClass({ hasError: Boolean(errors.email) })}
                  placeholder="hello@company.ru"
                />
              </FormField>
              <FormField id="guide-phone" label="Телефон" error={errors.phone} required>
                <input
                  id="guide-phone"
                  type="tel"
                  value={values.phone}
                  onChange={(e) =>
                    setValues((v) => ({ ...v, phone: e.target.value }))
                  }
                  className={fieldControlClass({ hasError: Boolean(errors.phone) })}
                  placeholder="+7 (999) 123-45-67"
                />
              </FormField>
              <Button
                type="submit"
                variant="onDark"
                size="lg"
                className="mt-2 w-full sm:w-auto"
              >
                Скачать гайд бесплатно
              </Button>
            </form>
          )}
        </div>
      </Container>
    </section>
  );
}

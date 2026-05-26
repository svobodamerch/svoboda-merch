import { Container } from "@/components/ui/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";

// Здесь будут логотипы клиентов
const clientLogos = [
  { name: "Клиент 1", placeholder: true },
  { name: "Клиент 2", placeholder: true },
  { name: "Клиент 3", placeholder: true },
  { name: "Клиент 4", placeholder: true },
  { name: "Клиент 5", placeholder: true },
  { name: "Клиент 6", placeholder: true },
];

export function ForWhom() {
  return (
    <section className="bg-cream py-16 md:py-24">
      <Container>
        <SectionHeading
          title="Работаем с брендами, которые хотят большего"
          description="Если вам важно, чтобы мерч носили — а не просто раздавали — мы на одной волне."
          align="center"
        />

        <div className="mt-12 grid grid-cols-2 gap-8 sm:grid-cols-3 md:grid-cols-6">
          {clientLogos.map((client, index) => (
            <div
              key={index}
              className="flex h-20 items-center justify-center rounded-2xl bg-paper px-4"
            >
              <span className="text-sm text-muted">{client.name}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

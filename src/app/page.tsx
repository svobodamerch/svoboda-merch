import { BrandStory } from "@/components/home/BrandStory";
import { FinalCta } from "@/components/home/FinalCta";
import { ForWhom } from "@/components/home/ForWhom";
import { Hero } from "@/components/home/Hero";
import { LeadMagnet } from "@/components/home/LeadMagnet";
import { OurServices } from "@/components/home/OurServices";
import { ProductCatalog } from "@/components/home/ProductCatalog";
import { ProductPaths } from "@/components/home/ProductPaths";
import { Reviews } from "@/components/home/Reviews";
import { TrustStrip } from "@/components/home/TrustStrip";
import { WhyUs } from "@/components/home/WhyUs";

export default function HomePage() {
  return (
    <>
      <Hero />
      <TrustStrip />
      <ProductPaths />
      <OurServices />
      <WhyUs />
      <Reviews />
      <ProductCatalog />
      <BrandStory />
      <ForWhom />
      <LeadMagnet />
      <FinalCta />
    </>
  );
}

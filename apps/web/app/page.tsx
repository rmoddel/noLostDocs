import { CategoryCards } from "@/components/marketing/CategoryCards";
import { DisclaimerSection } from "@/components/marketing/DisclaimerSection";
import { FinalCta } from "@/components/marketing/FinalCta";
import { HeroSection } from "@/components/marketing/HeroSection";
import { LostPhoneSection } from "@/components/marketing/LostPhoneSection";
import { ProductMockup } from "@/components/marketing/ProductMockup";
import { SecuritySection } from "@/components/marketing/SecuritySection";

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <CategoryCards />
      <ProductMockup />
      <SecuritySection />
      <LostPhoneSection />
      <DisclaimerSection />
      <FinalCta />
    </>
  );
}

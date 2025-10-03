import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Services } from "@/components/Services";
import { Reviews } from "@/components/Reviews";
import { Insurers } from "@/components/Insurers";
import { IntakeForm } from "@/components/IntakeForm";
import { OfficeInfo } from "@/components/OfficeInfo";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Services />
        <Reviews />
        <Insurers />
        <IntakeForm />
        <OfficeInfo />
      </main>
      <Footer />
    </div>
  );
};

export default Index;

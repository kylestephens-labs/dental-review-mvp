import { Button } from "@/components/ui/button";
import { Phone, Calendar, Star } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import heroImage from "@/assets/hero-dental.jpg";

export const Hero = () => {
  const scrollToForm = () => {
    const element = document.getElementById("intake-form");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const getHeadline = () => {
    switch (siteConfig.businessType) {
      case "dentist":
        return `Same-week appointments in ${siteConfig.city} — Family & Cosmetic Dentistry`;
      case "home_service":
        return `Trusted Home Services in ${siteConfig.city} — Fast & Reliable`;
      case "cleaning":
        return `Professional Cleaning Services in ${siteConfig.city} — Book Today`;
      default:
        return `Quality Service in ${siteConfig.city}`;
    }
  };

  const getSubheading = () => {
    switch (siteConfig.businessType) {
      case "dentist":
        return "Book in under 60 seconds. PPO insurance welcomed.";
      case "home_service":
        return "Same-day service available. Licensed & insured.";
      case "cleaning":
        return "Eco-friendly products. Satisfaction guaranteed.";
      default:
        return "Quality service you can trust.";
    }
  };

  return (
    <section className="relative pt-24 pb-16 md:pt-32 md:pb-24 bg-hero-gradient overflow-hidden">
      {/* Background Image Overlay */}
      <div 
        className="absolute inset-0 opacity-20 bg-cover bg-center"
        style={{ backgroundImage: `url(${heroImage})` }}
      />
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="text-primary-foreground">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
              {getHeadline()}
            </h1>
            <p className="text-xl md:text-2xl mb-6 text-primary-foreground/90">
              {getSubheading()}
            </p>

            {siteConfig.rating && (
              <div className="flex items-center mb-8 bg-background/10 backdrop-blur-sm rounded-lg px-4 py-3 w-fit">
                <div className="flex items-center mr-3">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(siteConfig.rating!.stars)
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-yellow-400/30"
                      }`}
                    />
                  ))}
                </div>
                <div className="text-sm">
                  <span className="font-bold">{siteConfig.rating.stars}</span>
                  <span className="text-primary-foreground/80 ml-1">
                    ({siteConfig.rating.count} reviews)
                  </span>
                </div>
              </div>
            )}

            {siteConfig.valueProps && siteConfig.valueProps.length > 0 && (
              <ul className="mb-8 space-y-2">
                {siteConfig.valueProps.map((prop, index) => (
                  <li key={index} className="flex items-center text-primary-foreground/90">
                    <span className="w-2 h-2 bg-accent rounded-full mr-3" />
                    {prop}
                  </li>
                ))}
              </ul>
            )}

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={scrollToForm}
                size="lg"
                className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Schedule Online
              </Button>
              <a href={`tel:${siteConfig.phone}`}>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full sm:w-auto bg-background/10 border-primary-foreground/30 text-primary-foreground hover:bg-background/20 text-lg px-8"
                >
                  <Phone className="w-5 h-5 mr-2" />
                  {siteConfig.phone}
                </Button>
              </a>
            </div>
          </div>

          <div className="hidden md:block">
            <img
              src={heroImage}
              alt={`${siteConfig.name} office`}
              className="rounded-2xl shadow-elegant"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

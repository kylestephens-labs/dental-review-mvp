import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";
import { siteConfig } from "@/config/site.config";

export const Services = () => {
  const scrollToForm = () => {
    const element = document.getElementById("intake-form");
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section id="services" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Our Services
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Comprehensive care tailored to your needs
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {siteConfig.services.map((service, index) => (
            <Card
              key={index}
              className="hover:shadow-card transition-shadow duration-300 cursor-pointer group"
              onClick={scrollToForm}
            >
              <CardHeader>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {service.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base mb-4">
                  {service.blurb}
                </CardDescription>
                <button className="text-accent hover:text-accent/80 font-medium inline-flex items-center group-hover:translate-x-1 transition-transform">
                  Learn more
                  <ArrowRight className="w-4 h-4 ml-1" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

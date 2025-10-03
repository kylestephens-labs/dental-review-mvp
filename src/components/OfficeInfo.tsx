import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, MapPin, Phone, Mail } from "lucide-react";
import { siteConfig } from "@/config/site.config";

export const OfficeInfo = () => {
  const formatHours = (hours: typeof siteConfig.hours[0]) => {
    const days = hours.days.length > 2
      ? `${hours.days[0]}-${hours.days[hours.days.length - 1]}`
      : hours.days.join(", ");
    
    const opens = new Date(`2000-01-01T${hours.opens}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
    const closes = new Date(`2000-01-01T${hours.closes}`).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });

    return `${days}: ${opens} - ${closes}`;
  };

  return (
    <section id="contact" className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            Visit Our Office
          </h2>
          <p className="text-lg text-muted-foreground">
            We're here to serve you with convenient hours and location
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          <div className="space-y-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-accent" />
                  Office Hours
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {siteConfig.hours.map((hour, index) => (
                  <p key={index} className="text-foreground">
                    {formatHours(hour)}
                  </p>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <MapPin className="w-5 h-5 mr-2 text-accent" />
                  Location
                </CardTitle>
              </CardHeader>
              <CardContent>
                <address className="not-italic text-foreground">
                  {siteConfig.address.line1}<br />
                  {siteConfig.address.city}, {siteConfig.address.region} {siteConfig.address.postalCode}
                </address>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-accent" />
                  Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-foreground">
                  <a href={`tel:${siteConfig.phone}`} className="hover:text-accent transition-colors">
                    {siteConfig.phone}
                  </a>
                </p>
                <p className="text-foreground flex items-center">
                  <Mail className="w-4 h-4 mr-2 text-muted-foreground" />
                  <a href={`mailto:${siteConfig.email}`} className="hover:text-accent transition-colors">
                    {siteConfig.email}
                  </a>
                </p>
              </CardContent>
            </Card>
          </div>

          <div>
            <Card className="shadow-card h-full">
              <CardContent className="p-0">
                <iframe
                  src={siteConfig.mapEmbedUrl}
                  width="100%"
                  height="100%"
                  style={{ minHeight: "400px", border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map to ${siteConfig.name}`}
                  className="rounded-lg"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
};

import { siteConfig } from "@/config/site.config";

export const Insurers = () => {
  if (!siteConfig.insurers || siteConfig.insurers.length === 0) {
    return null;
  }

  return (
    <section className="py-12 bg-background border-y border-border">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <p className="text-sm text-muted-foreground uppercase tracking-wide mb-2">
            We Accept
          </p>
          <h3 className="text-2xl font-bold text-primary">
            Major Insurance Plans
          </h3>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {siteConfig.insurers.map((insurer, index) => (
            <div
              key={index}
              className="text-center px-4 py-3 bg-secondary/50 rounded-lg"
            >
              <p className="text-foreground font-medium">{insurer}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground mt-6 text-sm">
          Don't see your insurance? Call us — we work with many providers.
        </p>
      </div>
    </section>
  );
};

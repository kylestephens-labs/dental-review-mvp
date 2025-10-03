import { Card, CardContent } from "@/components/ui/card";
import { Star } from "lucide-react";
import { siteConfig } from "@/config/site.config";
import { useState, useEffect } from "react";

const testimonials = [
  {
    name: "Sarah Johnson",
    text: "Best dental experience I've ever had! The staff is incredibly friendly and professional. Dr. Smith made me feel completely at ease.",
    rating: 5,
  },
  {
    name: "Michael Chen",
    text: "Same-day crown service was amazing. The technology they use is impressive, and the results are perfect. Highly recommend!",
    rating: 5,
  },
  {
    name: "Emily Rodriguez",
    text: "My whole family comes here now. They're great with kids and adults alike. The office is always clean and modern.",
    rating: 5,
  },
];

export const Reviews = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  if (!siteConfig.rating) return null;

  return (
    <section id="reviews" className="py-16 md:py-24 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
            What Our Patients Say
          </h2>
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center mr-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-6 h-6 ${
                    i < Math.floor(siteConfig.rating!.stars)
                      ? "text-yellow-400 fill-yellow-400"
                      : "text-yellow-400/30"
                  }`}
                />
              ))}
            </div>
            <div className="text-lg">
              <span className="font-bold">{siteConfig.rating.stars}</span>
              <span className="text-muted-foreground ml-1">
                ({siteConfig.rating.count} reviews)
              </span>
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto">
          <Card className="shadow-card">
            <CardContent className="p-8">
              <div className="flex items-center mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`w-5 h-5 ${
                      i < testimonials[currentIndex].rating
                        ? "text-yellow-400 fill-yellow-400"
                        : "text-yellow-400/30"
                    }`}
                  />
                ))}
              </div>
              <p className="text-lg mb-4 text-foreground italic">
                "{testimonials[currentIndex].text}"
              </p>
              <p className="text-primary font-semibold">
                — {testimonials[currentIndex].name}
              </p>
            </CardContent>
          </Card>

          <div className="flex justify-center mt-6 space-x-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={`w-3 h-3 rounded-full transition-all ${
                  index === currentIndex ? "bg-primary w-8" : "bg-border"
                }`}
                aria-label={`Go to review ${index + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

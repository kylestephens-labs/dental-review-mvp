import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Calendar, Loader2, CheckCircle } from "lucide-react";
import { leadFormSchema, LeadFormData } from "@/lib/validators";
import { siteConfig } from "@/config/site.config";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const timeSlots = [
  "8:00 AM - 9:00 AM",
  "9:00 AM - 10:00 AM",
  "10:00 AM - 11:00 AM",
  "11:00 AM - 12:00 PM",
  "12:00 PM - 1:00 PM",
  "1:00 PM - 2:00 PM",
  "2:00 PM - 3:00 PM",
  "3:00 PM - 4:00 PM",
  "4:00 PM - 5:00 PM",
];

export const IntakeForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<LeadFormData>({
    resolver: zodResolver(leadFormSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      service: "",
      preferredDate: "",
      preferredTime: "",
      notes: "",
      smsOptIn: false,
    },
  });

  const onSubmit = async (data: LeadFormData) => {
    setIsSubmitting(true);
  
    try {
      // Enforce: at least one contact method
      const phone = (data.phone || "").trim();
      const email = (data.email || "").trim().toLowerCase();
      if (!phone && !email) {
        toast.error("Please provide a phone number or an email.");
        setIsSubmitting(false);
        return;
      }
  
      // Build a stable dedup key (client-side; you can improve later server-side)
      const dedup_key = [email || "noemail", phone || "nophone"]
        .join("|")
        .toLowerCase();
  
      // Minimal payload that matches your current leads schema
      const payload: Record<string, unknown> = {
        business_name: siteConfig.name,     // e.g. "Acme Dental"
        city: siteConfig.city,              // e.g. "Walnut Creek, CA"
        email: email || null,
        phone: phone || null,
        status: "new",
        dedup_key,
        // Optional if you have it available in this component:
        // site_id: siteConfig.siteId, 
      };
  
      // Insert into Supabase
      const { error: supabaseError } = await supabase
        .from("leads")
        .insert([payload]);
  
      if (supabaseError) {
        console.error("Supabase error:", supabaseError);
        throw new Error("Failed to submit form");
      }
  
      // OPTIONAL: trigger your n8n webhook (ignore failures)
      try {
        // If you’re using Supabase Edge Functions: keep this
        const { error: functionError } = await supabase.functions.invoke("submit-lead", {
          body: {
            businessName: siteConfig.name,
            city: siteConfig.city,
            email,
            phone,
            // add any non-PHI summary fields you want n8n to use
          },
        });
        if (functionError) console.warn("Edge function error (non-blocking):", functionError);
      } catch (err) {
        console.warn("Webhook call skipped/failed (non-blocking):", err);
      }
  
      setIsSuccess(true);
      toast.success("Thank you! We'll contact you shortly to confirm.");
      form.reset();
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Something went wrong. Please try calling us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="intake-form" className="py-16 md:py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-primary mb-4">
              Book Your Appointment
            </h2>
            <p className="text-lg text-muted-foreground">
              Fill out the form below and we'll contact you to confirm your appointment
            </p>
          </div>

          <Card className="shadow-elegant">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-accent" />
                Schedule Your Visit
              </CardTitle>
              <CardDescription>
                Book in under 60 seconds. We'll confirm your appointment within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isSuccess ? (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-accent mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-primary mb-2">
                    Thank You!
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    We've received your request and will contact you shortly to confirm your appointment.
                  </p>
                  <Button onClick={() => setIsSuccess(false)}>
                    Submit Another Request
                  </Button>
                </div>
              ) : (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="John Smith" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number</FormLabel>
                            <FormControl>
                              <Input placeholder="(555) 123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="john@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="service"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Service Needed *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a service" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {siteConfig.services.map((service) => (
                                <SelectItem key={service.title} value={service.title}>
                                  {service.title}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="preferredDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Date *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="preferredTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Preferred Time *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a time" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {timeSlots.map((slot) => (
                                  <SelectItem key={slot} value={slot}>
                                    {slot}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Additional Notes (Optional)</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Tell us about your dental needs or any concerns..."
                              className="min-h-[100px]"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="smsOptIn"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel className="cursor-pointer">
                              I agree to receive text messages regarding my appointment
                            </FormLabel>
                            <p className="text-sm text-muted-foreground">
                              We'll only send appointment reminders and important updates
                            </p>
                          </div>
                        </FormItem>
                      )}
                    />

                    <p className="text-xs text-muted-foreground">
                      * Either phone or email is required
                    </p>

                    <Button
                      type="submit"
                      className="w-full bg-accent hover:bg-accent/90 text-lg py-6"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Calendar className="w-5 h-5 mr-2" />
                          Request Appointment
                        </>
                      )}
                    </Button>
                  </form>
                </Form>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

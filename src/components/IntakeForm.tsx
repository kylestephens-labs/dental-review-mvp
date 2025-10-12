import { useState, useEffect } from "react";
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
import { Calendar, Loader2, CheckCircle, Save, Clock } from "lucide-react";
import { leadFormSchema, LeadFormData } from "@/lib/validators";
import { siteConfig } from "@/config/site.config";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useFeatureFlag } from "@/hooks/use-feature-flag";

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

// Enhanced Auto-Save Component
const AutoSaveIndicator = () => {
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsSaving(true);
      // Simulate auto-save
      setTimeout(() => {
        setLastSaved(new Date());
        setIsSaving(false);
      }, 1000);
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500">
      {isSaving ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          <span>Saving...</span>
        </>
      ) : lastSaved ? (
        <>
          <Save className="h-4 w-4" />
          <span>Last saved: {lastSaved.toLocaleTimeString()}</span>
        </>
      ) : (
        <>
          <Clock className="h-4 w-4" />
          <span>Auto-save enabled</span>
        </>
      )}
    </div>
  );
};

// Enhanced Analytics Tracker
const AnalyticsTracker = () => {
  useEffect(() => {
    const trackEvent = (event: string, data?: Record<string, unknown>) => {
      console.log(`📊 Analytics: ${event}`, data);
      // In production, send to analytics service
    };

    // Track form interactions
    const handleFormInteraction = (event: Event) => {
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT') {
        trackEvent('form_field_interaction', {
          field: target.getAttribute('name'),
          type: target.getAttribute('type')
        });
      }
    };

    document.addEventListener('focus', handleFormInteraction, true);
    document.addEventListener('change', handleFormInteraction, true);

    return () => {
      document.removeEventListener('focus', handleFormInteraction, true);
      document.removeEventListener('change', handleFormInteraction, true);
    };
  }, []);

  return null; // Invisible component
};

// Enhanced Form with better validation and UX
const EnhancedIntakeForm = ({ autoSave, analytics }: { autoSave: boolean; analytics: boolean }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [formProgress, setFormProgress] = useState(0);

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

  // Track form progress
  useEffect(() => {
    const subscription = form.watch((value) => {
      const fields = ['name', 'phone', 'email', 'service', 'preferredDate', 'preferredTime'];
      const completedFields = fields.filter(field => value[field as keyof LeadFormData]);
      const progress = (completedFields.length / fields.length) * 100;
      setFormProgress(progress);
    });
    return () => subscription.unsubscribe();
  }, [form]);

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
  
      // Build payload that matches the actual database schema
      const payload: Record<string, unknown> = {
        business_name: siteConfig.name,
        city: siteConfig.city,
        source: "web",
        form: {
          name: data.name,
          email: email || null,
          phone: phone || null,
          service: data.service,
          preferredDate: data.preferredDate,
          preferredTime: data.preferredTime,
          notes: data.notes,
          smsOptIn: data.smsOptIn,
        }
      };
  
      const { error: functionError } = await supabase.functions.invoke("submit-lead", {
        body: payload,
      });
  
      if (functionError) {
        console.error("Edge function error:", functionError);
        throw new Error("Failed to submit form");
      }
  
      setIsSuccess(true);
      toast.success("Thank you! We'll contact you shortly to confirm.");
      
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-2xl font-semibold">Thank You!</h3>
            <p className="text-gray-600">
              We've received your appointment request and will contact you shortly to confirm.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Book Your Appointment</CardTitle>
        <CardDescription className="text-center">
          Fill out the form below and we'll get back to you within 24 hours.
        </CardDescription>
        
        {/* Enhanced Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${formProgress}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 text-center mt-2">
          {Math.round(formProgress)}% Complete
        </p>
      </CardHeader>
      
      <CardContent>
        {analytics && <AnalyticsTracker />}
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preferredDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Date</FormLabel>
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
                    <FormLabel>Preferred Time</FormLabel>
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
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any specific concerns or questions..."
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
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I'd like to receive SMS reminders about my appointment
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            {/* Auto-save indicator */}
            {autoSave && (
              <div className="flex justify-end">
                <AutoSaveIndicator />
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Request Appointment"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

// Basic Form (current implementation)
const BasicIntakeForm = () => {
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
  
      // Build payload that matches the actual database schema
      const payload: Record<string, unknown> = {
        business_name: siteConfig.name,
        city: siteConfig.city,
        source: "web",
        form: {
          name: data.name,
          email: email || null,
          phone: phone || null,
          service: data.service,
          preferredDate: data.preferredDate,
          preferredTime: data.preferredTime,
          notes: data.notes,
          smsOptIn: data.smsOptIn,
        }
      };
  
      const { error: functionError } = await supabase.functions.invoke("submit-lead", {
        body: payload,
      });
  
      if (functionError) {
        console.error("Edge function error:", functionError);
        throw new Error("Failed to submit form");
      }
  
      setIsSuccess(true);
      toast.success("Thank you! We'll contact you shortly to confirm.");
      
    } catch (error) {
      console.error("Form submission error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto" />
            <h3 className="text-2xl font-semibold">Thank You!</h3>
            <p className="text-gray-600">
              We've received your appointment request and will contact you shortly to confirm.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Book Your Appointment</CardTitle>
        <CardDescription className="text-center">
          Fill out the form below and we'll get back to you within 24 hours.
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name *</FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email Address</FormLabel>
                    <FormControl>
                      <Input placeholder="john@example.com" type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="preferredDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Preferred Date</FormLabel>
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
                    <FormLabel>Preferred Time</FormLabel>
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
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Any specific concerns or questions..."
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
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>
                      I'd like to receive SMS reminders about my appointment
                    </FormLabel>
                  </div>
                </FormItem>
              )}
            />

            <Button 
              type="submit" 
              className="w-full" 
              disabled={isSubmitting}
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Request Appointment"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};

// Main IntakeForm Component with Feature Flags
export const IntakeForm = () => {
  const { isEnabled: isEnhancedFormEnabled } = useFeatureFlag('ENHANCED_INTAKE_FORM');
  const { isEnabled: isAutoSaveEnabled } = useFeatureFlag('AUTO_SAVE');
  const { isEnabled: isAdvancedAnalyticsEnabled } = useFeatureFlag('ADVANCED_ANALYTICS');

  // Conditional rendering based on feature flags
  if (isEnhancedFormEnabled) {
    return (
      <EnhancedIntakeForm 
        autoSave={isAutoSaveEnabled}
        analytics={isAdvancedAnalyticsEnabled}
      />
    );
  }

  return <BasicIntakeForm />;
};
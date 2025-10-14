# Landing Page Template - Client Ready 🚀

A production-grade, Vercel-ready landing page template with intake form integration. Built with React, TypeScript, TailwindCSS, and Lovable Cloud (Supabase). Perfect for Dentists, Home Services, or Cleaning businesses.

## ✨ Features

- **Beautiful, responsive design** - Mobile-first with trust-centric palette
- **Intake form** - Stores leads in database and triggers n8n webhook
- **Easy theming** - Single `site.config.ts` for all site content
- **SEO optimized** - JSON-LD structured data, semantic HTML, meta tags
- **Production ready** - Deploys to Vercel in minutes

## 🚀 Quick Start

1. **Clone and install**
   ```bash
   npm install
   npm run dev
   ```

2. **Configure your site**
   Edit `src/config/site.config.ts` with your business details:
   ```typescript
   export const siteConfig = {
     businessType: "dentist", // or "home_service" or "cleaning"
     name: "Your Business Name",
     city: "Your City",
     phone: "+1-555-123-4567",
     // ... etc
   }
   ```

3. **Backend is already connected!**
   This project uses Lovable Cloud for backend (database, auth, edge functions). No external setup needed.

## 🎨 Customizing Design

### Colors & Branding

Update colors in `src/index.css`:
```css
:root {
  --primary: 203 76% 20%;  /* Your primary color in HSL */
  --accent: 176 79% 36%;   /* Your accent color in HSL */
}
```

### Site Content

All content is in `src/config/site.config.ts`:
- Services offered
- Business hours
- Contact information
- Insurance providers
- Value propositions
- Social media links

## 📋 Pages & Sections

- **Hero** - Headline, CTAs, rating badge, value props
- **Services** - Service cards with descriptions
- **Reviews** - Auto-rotating testimonials
- **Insurers** - Optional logo strip (hide if empty)
- **Intake Form** - Lead capture form
- **Office Info** - Hours, address, contact, map
- **Footer** - Navigation, contact, social

## 🔌 n8n Webhook Integration

To trigger n8n workflows when forms are submitted:

1. Create an n8n workflow with a webhook trigger
2. In Lovable Cloud, go to Edge Functions → Secrets
3. Add secret: `N8N_INTAKE_WEBHOOK` with your webhook URL
4. Forms will now trigger your n8n workflow automatically!

<lov-actions>
<lov-open-backend>Manage Secrets</lov-open-backend>
</lov-actions>

## 📊 View Your Leads

All form submissions are stored in the `leads` table:

<lov-actions>
<lov-open-backend>View Database</lov-open-backend>
</lov-actions>

## 🌐 Deploy to Production

1. Click "Publish" in the Lovable interface, or
2. Deploy to Vercel:
   ```bash
   vercel --prod
   ```

## 📱 SEO & Schema

The template includes:
- Semantic HTML structure (`<header>`, `<main>`, `<section>`, etc.)
- JSON-LD structured data for LocalBusiness/Dentist
- Optimized meta tags (title, description, OG, Twitter)
- Mobile-responsive with proper viewport
- Canonical tags

Update SEO in `index.html` with your business details.

## 🛠 Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first styling
- **Vite** - Build tool
- **Supabase** - Backend (PostgreSQL + Auth + Real-time) for lead generation
- **AWS RDS** - Core business data (PostgreSQL)
- **AWS SES** - Email service
- **Twilio** - SMS communications
- **Stripe** - Payment processing
- **Google Places API** - Maps integration
- **Google Calendar API** - Calendar integration
- **Facebook Graph API** - Social integration
- **React Hook Form** - Form management
- **Zod** - Validation
- **Shadcn/ui** - Component library

## 📝 Environment Variables

The backend is auto-configured via Lovable Cloud. No `.env` file needed!

Optional secrets (add in Cloud dashboard):
- `N8N_INTAKE_WEBHOOK` - Your n8n webhook URL

## 🎯 Making it Your Own

### For Different Industries

Change `businessType` in `site.config.ts`:
- `"dentist"` - Dental practices
- `"home_service"` - Plumbing, HVAC, electrical, etc.
- `"cleaning"` - Residential/commercial cleaning

The copy and CTAs adapt automatically!

### Adding Services

Edit the `services` array in `site.config.ts`:
```typescript
services: [
  { title: "Service Name", blurb: "Short description..." },
  // Add more...
]
```

### Customizing Forms

Edit `src/components/IntakeForm.tsx` to add/remove fields. Don't forget to update the validator in `src/lib/validators.ts`.

## 📚 Documentation

### **Core Project**
- [Architecture Overview](docs/dentist_project/architecture.md)
- [Business Plan](docs/dentist_project/business_plan)
- [MVP Specification](docs/dentist_project/MVP)
- [Task List](docs/dentist_project/tasks.md)

### **Development**
- [Workflow Guide](docs/WORKFLOW.md) - Development practices and TDD
- [Task Management](docs/MCP_ORCHESTRATOR.md) - Simple task tracking system
- [Feature Flags](docs/FEATURE_FLAGS.md) - Safe feature rollouts
- [Testing Strategy](docs/TESTING.md) - Unit, integration, and E2E tests

### **Operations**
- [Infrastructure](docs/INFRASTRUCTURE.md) - AWS services and architecture
- [API Documentation](docs/API.md) - REST API endpoints and examples
- [Deployment](docs/DEPLOYMENT.md) - Deployment and operational procedures

## 📚 Learn More

- [Lovable Cloud Documentation](https://docs.lovable.dev/features/cloud)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [Shadcn/ui Components](https://ui.shadcn.com/)

## 🤝 Support

Need help? Check the [Lovable Discord community](https://discord.gg/lovable)

---

**Built with ❤️ using Lovable**
# Test automation trigger

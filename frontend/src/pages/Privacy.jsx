/* eslint-disable */
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Cookie, Database, Mail, Globe } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/branding";

export default function Privacy() {
  return (
    <div data-testid="privacy-page" className="pt-20 min-h-screen">
      <div className="px-6 md:px-12 py-10 max-w-3xl">
        <Link to="/" className="text-xs font-tech uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground inline-flex items-center gap-2 mb-6">
          <ArrowLeft className="h-3 w-3" /> Back home
        </Link>
        <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">
          <span className="text-primary">●</span> Privacy
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-light tracking-tighter mb-3">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: Feb 2026 · Print Cosmos maker marketplace</p>

        <Section icon={Cookie} title="1 · Information we collect">
          <p className="mb-3">We collect information you provide directly when you:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/85">
            <li>Create an account (email, username, profile info)</li>
            <li>List products (photos, descriptions, dimensions, materials)</li>
            <li>Message other users through the platform</li>
            <li>Upload 3D designs or print files</li>
          </ul>
        </Section>

        <Section icon={Database} title="2 · Cookies and tracking">
          <p className="mb-3">Print Cosmos uses cookies and similar technologies to:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/85">
            <li>Maintain your session when you're signed in</li>
            <li>Remember your preferences (language, theme, etc.)</li>
            <li>Analyze site traffic and performance</li>
            <li>Show relevant content and recommendations</li>
          </ul>
        </Section>

        <Section icon={Globe} title="3 · Location data">
          When you select <strong>Time</strong> in the Browse sky toggle, Print Cosmos uses your device's IP address
          to obtain a coarse geographic location (city-level, via ipapi.co) solely to calculate local sunrise and
          sunset times. This data is used only in your browser to determine whether to show the day or night sky
          scene — it is never stored on our servers, never shared with third parties, and is discarded as soon as
          you leave the page or switch to Day or Night mode.
        </Section>

        <Section icon={Database} title="4 · How we use your data">
          <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/85">
            <li>Provide, maintain, and improve our services</li>
            <li>Communicate with you about your account and platform updates</li>
            <li>Process transactions and send you related information</li>
            <li>Prevent fraud, spam, and abuse</li>
            <li>Comply with legal obligations</li>
          </ul>
        </Section>

        <Section icon={ShieldCheck} title="5 · Data sharing & third parties">
          <p className="mb-3">We do not sell your personal information. We may share data with:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/85">
            <li><strong>Stripe</strong> for payment processing (they comply with PCI DSS)</li>
            <li><strong>Service providers</strong> who help us operate the platform</li>
            <li><strong>Legal authorities</strong> if required by law or to protect rights</li>
          </ul>
        </Section>

        <Section icon={Mail} title="6 · Your rights">
          You have the right to access, correct, or delete your personal data. You may also export your designs
          and print files at any time. Contact us to make a request or opt out of non-essential cookies.
        </Section>

        <div className="text-[10px] font-tech text-muted-foreground mt-12 border-t border-border pt-6">
          Questions? DM the platform admin from the Messages tab or email {SUPPORT_EMAIL}.
        </div>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <section className="mb-10">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-9 w-9 border border-border bg-card rounded-xl flex items-center justify-center">
          <Icon className="h-4 w-4 text-primary" strokeWidth={1.5} />
        </div>
        <h2 className="font-display text-xl font-medium tracking-tight">{title}</h2>
      </div>
      <div className="text-sm text-foreground/85 leading-relaxed">{children}</div>
    </section>
  );
}
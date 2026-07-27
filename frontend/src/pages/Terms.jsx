/* eslint-disable */
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, Image as ImageIcon, AlertTriangle, Scale, Tag } from "lucide-react";
import { SUPPORT_EMAIL } from "@/lib/branding";

export default function Terms() {
  return (
    <div data-testid="terms-page" className="pt-20 min-h-screen">
      <div className="px-6 md:px-12 py-10 max-w-3xl">
        <Link to="/" className="text-xs font-tech uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground inline-flex items-center gap-2 mb-6">
          <ArrowLeft className="h-3 w-3" /> Back home
        </Link>
        <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">
          <span className="text-primary">●</span> Legal
        </div>
        <h1 className="font-display text-4xl sm:text-5xl font-light tracking-tighter mb-3">Terms & Conditions</h1>
        <p className="text-sm text-muted-foreground mb-12">Last updated: Feb 2026 · Print Cosmos maker marketplace</p>

        <Section icon={Scale} title="1 · Platform overview">
          Print Cosmos is a marketplace for 3D-printed products and 3D design files. You may browse without an account.
          To list, message, comment, remix, rate, or upload, you must sign in. Disrespect for these terms can result in
          account suspension or removal of content at our discretion.
        </Section>

        <Section icon={Tag} title="2 · Seller terms of service">
          <p className="mb-3">By creating a listing on Print Cosmos as a seller, you agree to the following:</p>
          <ul className="list-disc pl-5 space-y-2 text-sm text-foreground/85">
            <li><strong>No inappropriate content.</strong> No weapons, weapon parts, hateful or extremist content, NSFW imagery, IP infringement, or anything that violates the laws where you ship from or to.</li>
            <li><strong>Two photos minimum.</strong> Every product listing must include at least two photos — typically a front view and a back view — so buyers know what they're getting. Service listings are exempt but must still include one cover image.</li>
            <li><strong>Honest descriptions.</strong> Dimensions, material, print time, and any post-processing must be accurate. Misrepresentation can result in chargebacks at your cost.</li>
            <li><strong>Original or licensed designs.</strong> You either created the design or have permission/license to sell prints made from it. Open-source licenses must be respected (e.g., attribution, non-commercial).</li>
            <li><strong>Ship within 7 days</strong> unless otherwise advertised, or refund the order. Communication is mandatory if there's a delay.</li>
            <li><strong>Service listings:</strong> if you sell a service (custom design, modeling, repair, on-demand printing), you set your own rules in the listing — turnaround, revisions, file delivery, etc. Buyers must agree to your stated terms before checkout.</li>
            <li><strong>Platform fee:</strong> 3.5% per sale, dropped to 2% for Hyperspace members. Calculated and shown at checkout.</li>
          </ul>
        </Section>

        <Section icon={ImageIcon} title="3 · Photos & rights">
          You retain copyright in the photos, descriptions, and 3D designs you upload. By posting, you grant Print Cosmos
          a worldwide non-exclusive license to display them on the platform. Buyers who download an "open source design"
          must respect the license you chose (default: attribution-share-alike).
        </Section>

        <Section icon={AlertTriangle} title="4 · Reports & safety">
          Any signed-in user can report a listing, a seller, or a comment by pressing the corresponding report button.
          Reports go to platform admins. Repeated violations of these terms or platform policy will result in account
          suspension. Spam reports may themselves be reported.
        </Section>

        <Section icon={ShieldCheck} title="5 · Moderation & Enforcement">
          Official administrative actions, platform tour components, and safety logging enforcement notices are run
          and issued by Print Cosmos moderators. This includes compliance prompts, warning overlays, and moderation
          communication pathways.
        </Section>

        <Section icon={ShieldCheck} title="6 · Payments, refunds, disputes">
          Payments are processed by Stripe. Print Cosmos does not store card data. Refund disputes are first handled
          between buyer and seller via the in-platform messaging tool; if unresolved within 7 days, escalate to
          {SUPPORT_EMAIL} with both parties' receipts.
        </Section>

        <Section icon={Scale} title="7 · Changes">
          We may update these terms. We'll surface major changes on the home page. Continued use after the update
          constitutes acceptance.
        </Section>

        <Section icon={ShieldCheck} title="8 · Location data (sky time mode)">
          When you select <strong>Time</strong> in the Browse sky toggle, Print Cosmos uses your device's IP address
          to obtain a coarse geographic location (city-level, via ipapi.co) solely to calculate local sunrise and
          sunset times. This data is used only in your browser to determine whether to show the day or night sky
          scene — it is never stored on our servers, never shared with third parties, and is discarded as soon as
          you leave the page or switch to Day or Night mode. Selecting Day or Night mode requires no location data.
          The same IP-based location is also used to surface locally relevant listings first in Browse results.
          See the <a href="https://aws.amazon.com/compliance/data-privacy-faq/" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground">AWS Data Privacy FAQ</a> for
          information about how infrastructure providers handle network data.
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

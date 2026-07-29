import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FileText, ChevronRight, BookOpen, Book } from 'lucide-react';

const sections = [
  { id: 'overview', icon: Book, label: 'Overview', desc: 'Platform overview and getting started' },
  { id: 'forum', icon: BookOpen, label: 'Forums', desc: 'Forum system overview and posting guidelines' },
  { id: 'listings', icon: FileText, label: 'Listings', desc: 'How to create and manage listings' },
  { id: 'qna', icon: BookOpen, label: 'Q&A', desc: 'Community Q&A guidelines and moderation' },
];

function SectionLink({ section, onClick, isActive }) {
  return (
    <button
      onClick={() => onClick(section.id)}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
        isActive
          ? 'bg-accent/10 text-accent border border-accent/20'
          : 'hover:bg-secondary/50 text-muted-foreground border border-transparent'
      }`}
    >
      <section.icon className="h-4 w-4 shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{section.label}</div>
        <div className="text-xs text-muted-foreground truncate">{section.desc}</div>
      </div>
      <ChevronRight className="h-3.5 w-3.5 shrink-0" />
    </button>
  );
}

function OverviewPanel() {
  return (
    <div className="space-y-4">
      <h2 className="font-display text-2xl font-light mb-2">Print Cosmos Documentation</h2>
      <p className="text-sm text-muted-foreground leading-relaxed">
        This documentation covers all aspects of the Print Cosmos platform, including user management, refund processing, warning systems, and administrative tools. Whether you are a new user exploring the marketplace for the first time or an experienced seller looking to optimize your listings, you will find detailed guidance across every section. The platform is designed to empower makers, designers, and collectors alike, providing a seamless experience from browsing designs to selling your own creations.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        For platform owners and administrators, there are advanced tools for managing users, processing refunds, issuing warnings, and reviewing audit logs. Each area of the platform is documented thoroughly so you can understand the workflows, available actions, and best practices for maintaining a healthy community marketplace.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
        {sections.map((s) => (
          <div key={s.id} className="border border-border rounded-xl bg-card p-4 hover:bg-secondary/30 transition-colors">
            <div className="flex items-center gap-2 mb-2">
              <s.icon className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium">{s.label}</span>
            </div>
            <p className="text-xs text-muted-foreground">{s.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ForumsPanel() {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl font-light mb-2">Forums</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        The platform's forums provide a community space where users can discuss 3D printing topics, share their latest designs, ask technical questions, and participate in hardware reviews. Posts can be created as text, image, or link posts, giving users flexibility in how they share information. Each forum post can be upvoted or downvoted by the community, and threaded comment discussions allow for detailed conversations.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        The forums are organized into categories including 3D Printing Help, Design Showcases, General Chat, and Hardware Reviews, making it easy to find relevant discussions. Users can track their recently viewed posts through a history feature, and the best quality posts can be recognized with rocket thread rewards. Forum moderation tools allow admins to pin important threads, manage content, and ensure productive community discussions.
      </p>
    </div>
  );
}

function ListingsPanel() {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl font-light mb-2">Listings</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Listings are the core marketplace units in the platform, allowing users to offer their 3D designs for sale or download. Creators can upload 3D files along with a title, description, relevant tags, and pricing information. Each listing has a dedicated detail page that displays a full preview, metadata such as print time and filament type, and user reviews with ratings from one to five stars.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        Buyers can report inappropriate listings with a reason category, and listings can be in active, suspended, or terminated states depending on moderation actions. Download counts are tracked per listing, giving sellers insight into interest levels. Before publishing, creators must complete a copyright certification to verify ownership of the design. The platform also supports collection grouping, wishlists, and comparison tools to enhance the shopping experience.
      </p>
    </div>
  );
}

function QnAPanel() {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl font-light mb-2">Q&A Guidelines</h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        The Q&A system allows community members to ask and answer questions about 3D printing, design creation, and platform usage. All participants are expected to be respectful and constructive in their interactions, and users should search for existing answers before posting new questions to avoid duplication. Providing detailed context when asking technical questions helps the community provide better answers.
      </p>
      <p className="text-sm text-muted-foreground leading-relaxed">
        The community can upvote helpful answers and downvote unhelpful ones, ensuring the best information rises to the top. Spam and abusive content should be reported using the platform's report system, and all users must follow the platform terms when sharing design files or code snippets. Moderators can remove inappropriate questions or answers, flag content for review, and mute users who repeatedly violate community guidelines.
      </p>
    </div>
  );
}

function DocsContent({ sectionId }) {
  switch (sectionId) {
    case 'overview': return <OverviewPanel />;
    case 'forum': return <ForumsPanel />;
    case 'listings': return <ListingsPanel />;
    case 'qna': return <QnAPanel />;
    default: return <OverviewPanel />;
  }
}

export default function Docs() {
  const [activeSection, setActiveSection] = useState('overview');
  const location = useLocation();

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const section = params.get('section');
    if (section && ['overview', 'forum', 'listings', 'qna'].includes(section)) {
      setActiveSection(section);
    }
  }, [location.search]);

  return (
    <div className="pt-14 min-h-screen px-6 md:px-12 lg:px-24 pb-20" data-testid="docs-page">
      <div className="text-xs font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">Documentation</div>
      <h1 className="font-display text-4xl font-light mb-10">Print Cosmos Docs</h1>
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        <nav className="space-y-1">
          {sections.map((s) => (
            <SectionLink key={s.id} section={s} onClick={setActiveSection} isActive={activeSection === s.id} />
          ))}
        </nav>
        <main className="min-w-0">
          <DocsContent sectionId={activeSection} />
        </main>
      </div>
    </div>
  );
}


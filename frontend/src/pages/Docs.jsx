import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { FolderOpen, FileText, ChevronRight, BookOpen, Settings, Users, DollarSign, Shield, RefreshCw, Book } from 'lucide-react';

const sections = [
  { id: 'overview', icon: Book, label: 'Overview', desc: 'Platform overview and getting started' },
  { id: 'analytics', icon: Settings, label: 'Analytics Dashboard', desc: 'Owner analytics, metrics, and reporting' },
  { id: 'user-management', icon: Users, label: 'User Management', desc: 'Search, verify, suspend, and terminate users' },
  { id: 'refunds', icon: DollarSign, label: 'Refund Manager', desc: 'Approve and deny refund requests' },
  { id: 'warnings', icon: Shield, label: 'Warning Management', desc: 'Issue, resolve, and purge warnings' },
  { id: 'reports', icon: Shield, label: 'Bug Reports & Safety', desc: 'View and manage safety reports' },
  { id: 'support', icon: Users, label: 'Support Messages', desc: 'View and respond to support DMs' },
  { id: 'audit', icon: BookOpen, label: 'Audit Logs', desc: 'Admin action history and compliance' },
  { id: 'cleanup', icon: RefreshCw, label: 'Security Cleanup', desc: 'Purge sessions, accounts, and reports' },
  { id: 'forum', icon: BookOpen, label: 'Forums', desc: 'Forum system overview and posting guidelines' },
  { id: 'listings', icon: FileText, label: 'Listings', desc: 'How to create and manage listings' },
  { id: 'qna', icon: Users, label: 'Q&A', desc: 'Community Q&A guidelines and moderation' },
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
        This documentation covers all aspects of the Print Cosmos platform, including the owner
        analytics dashboard, user management, refund processing, warning systems, and administrative tools.
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

function AnalyticsPanel() {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl font-light mb-2">Analytics Dashboard</h3>
      <p className="text-sm text-muted-foreground">
        The owner analytics dashboard provides real-time metrics on platform performance. Accessible
        only to platform owners via <code className="bg-secondary px-1 rounded text-xs">/owner/analytics</code>.
      </p>
      <h4 className="text-xs font-tech uppercase tracking-wider text-muted-foreground mt-4">Key Metrics</h4>
      <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
        <li>Daily downloads and sales conversions</li>
        <li>Revenue gross margins and platform fees</li>
        <li>User and seller registration counts</li>
        <li>Forum mentions and tagged posts</li>
        <li>Bug reports with urgent flagging</li>
        <li>Support message inbox</li>
        <li>Most-reported users and listings</li>
        <li>Hyperspace signup trends</li>
        <li>Stuck transaction monitoring</li>
        <li>Cascade warning analysis</li>
        <li>Revenue statistics (7d, 30d)</li>
      </ul>
    </div>
  );
}

function UserManagementPanel() {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl font-light mb-2">User Management</h3>
      <p className="text-sm text-muted-foreground">
        The user management dashboard allows platform owners to search for users, view their details,
        and take administrative actions including verification toggle, suspension, termination, and medal awards.
      </p>
      <h4 className="text-xs font-tech uppercase tracking-wider text-muted-foreground mt-4">Available Actions</h4>
      <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
        <li><strong>Search</strong> — Find users by ID or query</li>
        <li><strong>Verify/Unverify</strong> — Toggle user verification status</li>
        <li><strong>Suspend</strong> — Temporarily or permanently suspend accounts</li>
        <li><strong>Terminate</strong> — Permanently delete user accounts</li>
        <li><strong>Award Medal</strong> — Recognize contributors with gold, silver, or bronze medals</li>
      </ul>
    </div>
  );
}

function RefundPanel() {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl font-light mb-2">Refund Manager</h3>
      <p className="text-sm text-muted-foreground">
        The refund manager provides a centralized interface for reviewing and processing refund requests.
      </p>
      <h4 className="text-xs font-tech uppercase tracking-wider text-muted-foreground mt-4">Workflow</h4>
      <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
        <li>Review pending refund requests in the queue</li>
        <li>Click <strong>Approve</strong> to process a refund</li>
        <li>Click <strong>Deny</strong> to reject a refund (reason auto-generated)</li>
        <li>Monitor request status in real-time</li>
      </ul>
      <h4 className="text-xs font-tech uppercase tracking-wider text-muted-foreground mt-4">API Endpoints</h4>
      <code className="block bg-secondary p-2 rounded text-xs text-foreground">
        GET /api/owner/refund-requests{'\n'}
        POST /api/owner/refund-requests/&#123;id&#125;/approve{'\n'}
        POST /api/owner/refund-requests/&#123;id&#125;/deny
      </code>
    </div>
  );
}

function WarningPanel() {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl font-light mb-2">Warning Management</h3>
      <p className="text-sm text-muted-foreground">
        The warning management system allows platform owners to issue warnings, resolve them, and
        permanently purge warning histories. It also includes cascade analysis to detect similar
        warning patterns across users.
      </p>
      <h4 className="text-xs font-tech uppercase tracking-wider text-muted-foreground mt-4">Actions</h4>
      <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
        <li><strong>Issue Warning</strong> — Send a formal warning to a user with a reason</li>
        <li><strong>Resolve Warning</strong> — Mark a warning as resolved</li>
        <li><strong>Purge Warning</strong> — Permanently delete warning records</li>
        <li><strong>Cascade Analysis</strong> — Detect similar warning patterns across the platform</li>
      </ul>
    </div>
  );
}

function ReportsPanel() {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl font-light mb-2">Bug Reports & Safety Reports</h3>
      <p className="text-sm text-muted-foreground">
        The reports section displays all bug reports submitted by users, categorized by urgency level.
        Urgent reports are highlighted for immediate attention.
      </p>
      <h4 className="text-xs font-tech uppercase tracking-wider text-muted-foreground mt-4">Features</h4>
      <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
        <li>Filter reports by urgency (urgent vs. normal)</li>
        <li>Toggle report urgency status</li>
        <li>View report details including target, reporter, and reason</li>
        <li>Safety reports for moderation and content review</li>
      </ul>
    </div>
  );
}

function SupportPanel() {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl font-light mb-2">Support Messages</h3>
      <p className="text-sm text-muted-foreground">
        The support messages section shows all user-submitted support DMs and messages awaiting response.
        Each message displays the sender name, timestamp, read/unread status, and message content.
      </p>
      <h4 className="text-xs font-tech uppercase tracking-wider text-muted-foreground mt-4">Features</h4>
      <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
        <li>View unread messages highlighted with NEW badge</li>
        <li>See sender name and timestamp for each message</li>
        <li>Line-clamped content preview with full text available</li>
        <li>Message count display for pending responses</li>
      </ul>
    </div>
  );
}

function AuditPanel() {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl font-light mb-2">Audit Logs</h3>
      <p className="text-sm text-muted-foreground">
        The audit logs section provides a chronological history of all administrative actions taken
        on the platform. Each log entry includes a timestamp, admin ID, action type, target ID, and details.
      </p>
      <h4 className="text-xs font-tech uppercase tracking-wider text-muted-foreground mt-4">Monitored Actions</h4>
      <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
        <li>User warnings issued, resolved, and purged</li>
        <li>Refund requests approved and denied</li>
        <li>Account suspensions and terminations</li>
        <li>Content removal actions</li>
        <li>System configuration changes</li>
        <li>Medal awards and verification changes</li>
      </ul>
    </div>
  );
}

function CleanupPanel() {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl font-light mb-2">Security Cleanup</h3>
      <p className="text-sm text-muted-foreground">
        The security cleanup tools help maintain platform health by removing stale data and archived records.
      </p>
      <h4 className="text-xs font-tech uppercase tracking-wider text-muted-foreground mt-4">Available Operations</h4>
      <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
        <li><strong>Purge Expired Sessions</strong> — Remove sessions older than 30 days</li>
        <li><strong>Clean Unverified Accounts</strong> — Remove accounts unverified for 90+ days</li>
        <li><strong>Archive Old Reports</strong> — Archive resolved reports older than 1 year</li>
      </ul>
      <p className="text-xs text-muted-foreground mt-2">Each operation requires confirmation before execution to prevent accidental data loss.</p>
    </div>
  );
}

function ForumsPanel() {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl font-light mb-2">Forums</h3>
      <p className="text-sm text-muted-foreground">
        The Print Cosmos forums provide a community space for users to discuss 3D printing topics,
        share designs, ask questions, and engage in hardware reviews.
      </p>
      <h4 className="text-xs font-tech uppercase tracking-wider text-muted-foreground mt-4">Forum Features</h4>
      <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
        <li><strong>Post Creation</strong> — Create text, image, or link posts</li>
        <li><strong>Categories</strong> — 3D Printing Help, Design Showcases, General Chat, Hardware Reviews</li>
        <li><strong>Voting System</strong> — Upvote and downvote posts and comments</li>
        <li><strong>Comments</strong> — Nested comment threads with like support</li>
        <li><strong>Forum History</strong> — Track viewed posts and prune old history</li>
        <li><strong>Rocket Threads</strong> — Grant filament thread balance for quality posts</li>
      </ul>
    </div>
  );
}

function ListingsPanel() {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl font-light mb-2">Listings</h3>
      <p className="text-sm text-muted-foreground">
        Listings are the core marketplace units in Print Cosmos. Users can create, browse, search,
        and filter listings to find 3D designs to purchase or download.
      </p>
      <h4 className="text-xs font-tech uppercase tracking-wider text-muted-foreground mt-4">Listing Features</h4>
      <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
        <li><strong>Create Listing</strong> — Upload 3D files with title, description, tags, and pricing</li>
        <li><strong>Listing Detail</strong> — View full listing with preview, metadata, and reviews</li>
        <li><strong>Ratings</strong> — Rate listings (1-5 stars) after purchase</li>
        <li><strong>Reports</strong> — Report inappropriate listings with reason category</li>
        <li><strong>Status Management</strong> — Active, suspended, or terminated listing states</li>
        <li><strong>Download Tracking</strong> — Monitor download counts per listing</li>
        <li><strong>Copyright Certification</strong> — Ownership verification before publishing</li>
      </ul>
    </div>
  );
}

function QnAPanel() {
  return (
    <div className="space-y-3">
      <h3 className="font-display text-xl font-light mb-2">Q&A Guidelines</h3>
      <p className="text-sm text-muted-foreground">
        The Print Cosmos Q&A system allows community members to ask and answer questions about 3D
        printing, design creation, and platform usage.
      </p>
      <h4 className="text-xs font-tech uppercase tracking-wider text-muted-foreground mt-4">Participation Guidelines</h4>
      <ul className="text-sm text-muted-foreground space-y-1 ml-4 list-disc">
        <li>Be respectful and constructive in all interactions</li>
        <li>Search for existing answers before posting new questions</li>
        <li>Provide detailed context when asking technical questions</li>
        <li>Upvote helpful answers and downvote unhelpful ones</li>
        <li>Report spam or abusive content using the report system</li>
        <li>Follow platform terms when sharing design files or code snippets</li>
      </ul>
      <h4 className="text-xs font-tech uppercase tracking-wider text-muted-foreground mt-4">Moderation</h4>
      <p className="text-sm text-muted-foreground">
        Moderators can remove inappropriate questions or answers, flag content for review, and
        mute users who repeatedly violate community guidelines.
      </p>
    </div>
  );
}

function DocsContent({ sectionId }) {
  switch (sectionId) {
    case 'overview': return <OverviewPanel />;
    case 'analytics': return <AnalyticsPanel />;
    case 'user-management': return <UserManagementPanel />;
    case 'refunds': return <RefundPanel />;
    case 'warnings': return <WarningPanel />;
    case 'reports': return <ReportsPanel />;
    case 'support': return <SupportPanel />;
    case 'audit': return <AuditPanel />;
    case 'cleanup': return <CleanupPanel />;
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
    if (section && ['overview', 'analytics', 'user-management', 'refunds', 'warnings', 'reports', 'support', 'audit', 'cleanup', 'forum', 'listings', 'qna'].includes(section)) {
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

/* eslint-disable */
import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { AlertTriangle, AtSign, Users, TrendingUp, Flag, CreditCard, ExternalLink, DollarSign, Mail, Shield, UserCheck, ShieldAlert, ShieldCheck, Search, MoreVertical, UserX, Award, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import WarningBanner from "@/components/WarningBanner";

export default function OwnerAnalytics() {
  const { user } = useAuth();
  const navigate = useNavigate();

// existing metrics
  const [rows, setRows] = useState([]);

  // new sections
  const [mentions, setMentions] = useState([]);
  const [reports, setReports] = useState([]);
  const [counts, setCounts] = useState(null);
  const [mostReported, setMostReported] = useState([]);
  const [hyperspaceTrend, setHyperspaceTrend] = useState([]);
  const [stuckTxns, setStuckTxns] = useState([]);
  const [revenueStats, setRevenueStats] = useState(null);
  const [supportMessages, setSupportMessages] = useState([]);
  const [warningUserId, setWarningUserId] = useState("");
  const [warningReason, setWarningReason] = useState("");
  const [warnings, setWarnings] = useState([]);
  const [isLoadingWarnings, setIsLoadingWarnings] = useState(false);

  // Load warnings data
  const fetchWarnings = async () => {
    if (!user) return;
    try {
      const res = await api.get(`/api/owner/users/${user.user_id}/warnings`);
      setWarnings(res.data || []);
    } catch (err) {
      console.warn("Failed to fetch warnings", err);
    }
  };

  useEffect(() => {
    fetchWarnings();
  }, [user]);

  const handleWarnSubmit = async (e) => {
    e.preventDefault();
    if (!warningUserId ||!warningReason) {
      toast.error("Please provide both user ID and reason");
      return;
    }
    try {
      await api.post(`/api/owner/users/${warningUserId}/warn`, {
        reason: warningReason,
        level: "warning"
      });
      setWarningUserId("");
      setWarningReason("");
      fetchWarnings();
      toast.success("Warning issued successfully");
    } catch (error) {
      toast.error("Failed to issue warning");
    }
  };

  const resolveWarningHandle = async (userId) => {
    try {
      await api.post(`/api/admin/warnings/resolve`, { user_id: userId });
      fetchWarnings();
      toast.success("Warning resolved");
    } catch (error) {
      toast.error("Failed to resolve warning");
    }
  };

  const purgeWarningHandle = async (userId) => {
    if (!confirm("Are you sure you want to permanently purge this warning history? This action cannot be undone.")) return;
    try {
      await api.delete(`/api/admin/warnings/purge/${userId}`);
      fetchWarnings();
      toast.success("Warning purged");
    } catch (error) {
      toast.error("Failed to purge warning");
    }
  };

  const handleCascadeAnalysis = async (userId) => {
    try {
      const res = await api.get(`/api/admin/warnings/cascade/${userId}`);
      if (res.data && res.data.similar_count > 0) {
        toast.info(`Detected ${res.data.similar_count} potential matching warning patterns`);
      } else {
        toast.info("No similar warning patterns detected");
      }
    } catch (error) {
      toast.error("Failed to run cascade analysis");
    }
  };

  // Refund Manager
  const [refundRequests, setRefundRequests] = useState([]);
  const [refundLoading, setRefundLoading] = useState(false);

  const fetchRefundRequests = async () => {
    try {
      const res = await api.get("/api/owner/refund-requests");
      setRefundRequests(res.data || []);
    } catch (error) {
      console.warn("Failed to fetch refund requests", error);
    }
  };

  const approveRefund = async (requestId) => {
    setRefundLoading(true);
    try {
      await api.post(`/api/owner/refund-requests/${requestId}/approve`);
      fetchRefundRequests();
      toast.success("Refund approved");
    } catch (error) {
      toast.error("Failed to approve refund");
    } finally {
      setRefundLoading(false);
    }
  };

  const denyRefund = async (requestId, reason = "Not eligible for refund") => {
    setRefundLoading(true);
    try {
      await api.post(`/api/owner/refund-requests/${requestId}/deny`, { reason });
      fetchRefundRequests();
      toast.info("Refund denied");
    } catch (error) {
      toast.error("Failed to deny refund");
    } finally {
      setRefundLoading(false);
    }
  };

  // User Management
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await api.get(`/api/owner/users/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      setSearchResults(res.data || []);
    } catch (error) {
      toast.error("Search failed");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const triggerVerification = async (userId) => {
    try {
      await api.post(`/api/owner/users/${userId}/toggle-verification`);
      // Refresh search results
      const res = await api.get(`/api/owner/users/search?q=${encodeURIComponent(searchQuery)}&limit=20`);
      setSearchResults(res.data || []);
      toast.success("Verification toggled");
    } catch (error) {
      toast.error("Failed to toggle verification");
    }
  };

  const suspendUser = async (userId, reason, duration) => {
    if (!confirm(`Suspend user ${userId}?`)) return;
    try {
      await api.post(`/api/owner/users/${userId}/suspend`, { reason, duration });
      toast.success("User suspended");
    } catch (error) {
      toast.error("Failed to suspend user");
    }
  };

  const terminateUser = async (userId, reason) => {
    if (!confirm(`PERMANENTLY terminate user ${userId}? This cannot be undone.`)) return;
    try {
      await api.post(`/api/owner/users/${userId}/terminate`, { reason });
      toast.error("User terminated");
    } catch (error) {
      toast.error("Failed to terminate user");
    }
  };

  const awardMedal = async (userId, medalType, criteria) => {
    try {
      await api.post(`/api/owner/users/${userId}/award-medal`, { medal_type: medalType, criteria });
      toast.success("Medal awarded");
    } catch (error) {
      toast.error("Failed to award medal");
    }
  };

  // Notification Settings
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false,
    security_alerts: true,
    weekly_reports: false
  });

  const handleNotificationChange = async (key, value) => {
    setNotificationSettings(prev => ({...prev, [key]: value}));
    try {
      await api.post(`/api/admin/notifications/settings`, { [key]: value });
      toast.success("Settings updated");
    } catch (error) {
      toast.error("Failed to update settings");
      // revert on error
      setNotificationSettings(prev => ({...prev, [key]: !value}));
    }
  };

  // Admin Audit Logs
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    try {
      const res = await api.get("/api/admin/audit-logs?limit=50");
      setAuditLogs(res.data || []);
    } catch (error) {
      console.warn("Failed to fetch audit logs", error);
    } finally {
      setAuditLoading(false);
    }
  };

  const runCleanup = async (type) => {
    if (!confirm(`Run ${type.replace(/_/g, ' ')} cleanup?`)) return;
    try {
      await api.post(`/api/admin/cleanup/${type}`);
      toast.success(`Cleanup ${type.replace(/_/g, ' ')} completed`);
      fetchAuditLogs();
    } catch (error) {
      toast.error("Cleanup failed");
    }
  };

  useEffect(() => {
    if (user?.is_platform_owner) {
      fetchWarnings();
      fetchRefundRequests();
      fetchAuditLogs();
    }
  }, [user]);

  const markUrgent = async (reportId, current) => {
    try {
      await api.patch(`/reports/${reportId}/urgent`, { is_urgent: !current });
      setReports((prev) =>
        prev.map((r) => r.report_id === reportId ? { ...r, is_urgent: !current } : r)
      );
      toast.success(current ? "Marked normal" : "Marked urgent");
    } catch {
      toast.error("Could not update report");
    }
  };

  const maxDownloads = useMemo(() => Math.max(1, ...rows.map((r) => Number(r.daily_downloads || 0))), [rows]);
  const maxRevenue   = useMemo(() => Math.max(1, ...rows.map((r) => Number(r.gross_revenue || 0))), [rows]);
  const maxHyperspace = useMemo(() => Math.max(1, ...hyperspaceTrend.map((r) => r.initiated || 0)), [hyperspaceTrend]);

  const urgentReports = reports.filter((r) => r.is_urgent);
  const normalReports = reports.filter((r) => !r.is_urgent);

  if (!user) return null;

  return (
    <div className="pt-14 min-h-screen px-6 md:px-12 lg:px-24 pb-20" data-testid="owner-analytics-page">
      <div className="text-xs font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">Owner Analytics</div>
      <h1 className="font-display text-4xl font-light mb-10">Privatized Platform Analytics Dashboard</h1>
      
      {/* WarningBanner - enforcement warning display */}
      <WarningBanner />
      
      {/* ── User & Seller Counts ─────────────────────────────────────── */}
      {counts && (
        <section className="mb-8">
          <SectionLabel icon={Users} title="User & Seller Counts" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total Users"    value={counts.total_users} />
            <StatCard label="Total Sellers"  value={counts.total_sellers} />
            <StatCard label="New Users 14d"  value={counts.new_users_14d}   accent />
            <StatCard label="New Sellers 14d" value={counts.new_sellers_14d} accent />
            <StatCard label="New Users 30d"  value={counts.new_users_30d} />
            <StatCard label="New Sellers 30d" value={counts.new_sellers_30d} />
          </div>
        </section>
      )}

      {/* ── Revenue Statistics ─────────────────────────────────────── */}
      {revenueStats && (
        <section className="mb-8">
          <SectionLabel icon={DollarSign} title="Revenue Statistics" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <StatCard label="Total Gross Revenue" value={revenueStats.total_gross_revenue ? `$${Number(revenueStats.total_gross_revenue).toFixed(2)}` : "$0.00"} />
            <StatCard label="Platform Fees Collected" value={revenueStats.total_platform_fees ? `$${Number(revenueStats.total_platform_fees).toFixed(2)}` : "$0.00"} />
            <StatCard label="Gross Revenue (30d)" value={revenueStats.recent_gross_revenue_30d ? `$${Number(revenueStats.recent_gross_revenue_30d).toFixed(2)}` : "$0.00"} accent />
            <StatCard label="Platform Fees (30d)" value={revenueStats.recent_platform_fees_30d ? `$${Number(revenueStats.recent_platform_fees_30d).toFixed(2)}` : "$0.00"} accent />
            <StatCard label="Gross Revenue (7d)" value={revenueStats.recent_gross_revenue_7d ? `$${Number(revenueStats.recent_gross_revenue_7d).toFixed(2)}` : "$0.00"} />
            <StatCard label="Platform Fees (7d)" value={revenueStats.recent_platform_fees_7d ? `$${Number(revenueStats.recent_platform_fees_7d).toFixed(2)}` : "$0.00"} />
          </div>
        </section>
      )}

      {/* ── Core metrics (existing) ──────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-8">
        <MetricPanel title="Daily Downloads">
          {rows.map((r) => (
            <BarRow key={`d-${r.date}`} label={r.date} value={Number(r.daily_downloads || 0)} max={maxDownloads} />
          ))}
        </MetricPanel>
        <MetricPanel title="Sales Conversions (%)">
          {rows.map((r) => (
            <BarRow key={`c-${r.date}`} label={r.date} value={Number(r.sales_conversions || 0)} max={100} fixedSuffix="%" />
          ))}
        </MetricPanel>
        <MetricPanel title="Revenue Gross Margins ($)">
          {rows.map((r) => (
            <BarRow key={`m-${r.date}`} label={r.date} value={Number(r.revenue_gross_margins || 0)} max={maxRevenue} money />
          ))}
        </MetricPanel>
      </div>

      {/* ── Tagged on Forums ─────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionLabel icon={AtSign} title="Tagged on Forums" />
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          {mentions.length === 0 ? (
            <div className="px-4 py-6 text-xs font-tech text-muted-foreground">No forum mentions yet.</div>
          ) : (
            <ul className="divide-y divide-border">
              {mentions.map((m) => (
                <li key={m.mention_id} className="px-4 py-3 flex items-start gap-3">
                  <AtSign className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-tech text-muted-foreground mb-0.5">
                      <span className="text-foreground">{m.author_name}</span>
                      {" "}mentioned you in{" "}
                      <span className="text-primary font-medium truncate">{m.post_title || m.post_id}</span>
                      <span className="ml-2 opacity-50">{m.created_at?.slice(0, 10)}</span>
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2 italic">"{m.comment_excerpt}"</div>
                  </div>
                  <Link
                    to={`/forums`}
                    className="shrink-0 text-[10px] font-tech uppercase tracking-wider text-primary hover:underline inline-flex items-center gap-1"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* ── Warning Management ─────────────────────────────────────── */}
      <section className="mb-8">
        <SectionLabel icon={ShieldAlert} title="Warning Management" />
        
        <div className="mb-4">
          <form onSubmit={handleWarnSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="User ID"
              value={warningUserId}
              onChange={(e) => setWarningUserId(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
            <input
              type="text"
              placeholder="Warning reason"
              value={warningReason}
              onChange={(e) => setWarningReason(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
              required
            />
            <Button type="submit" variant="destructive" size="sm">
              Issue Warning
            </Button>
          </form>
        </div>
        
        {warnings.length > 0 ? (
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">User ID</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Reason</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Timestamp</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {warnings.map((w) => (
                  <tr key={w.warning_id || w.user_id} className="border-b border-border/60 hover:bg-secondary/30">
                    <td className="px-4 py-2 font-tech text-[10px] truncate max-w-[140px]">{w.user_id || w.target_user_id}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-tech uppercase tracking-wider bg-amber-500/10 text-amber-500">
                        {w.enforcement_status || "Warned"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground truncate max-w-[200px]">{w.warning_reason || w.reason}</td>
                    <td className="px-4 py-2 text-muted-foreground">{w.warning_timestamp || w.created_at?.slice(0, 16)}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" onClick={() => resolveWarningHandle(w.user_id || w.target_user_id)}>
                          Resolve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => purgeWarningHandle(w.user_id || w.target_user_id)}>
                          Purge
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleCascadeAnalysis(w.user_id || w.target_user_id)}>
                          Cascade
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-6 text-xs font-tech text-muted-foreground">No active warnings.</div>
        )}
      </section>

      {/* ── Bug Reports ──────────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionLabel icon={AlertTriangle} title="Bug Reports" />

        {urgentReports.length > 0 && (
          <div className="mb-3">
            <div className="text-[10px] font-tech uppercase tracking-wider text-destructive mb-2 flex items-center gap-1.5">
              <AlertTriangle className="h-3 w-3" /> Urgent — needs immediate attention
            </div>
            <ReportTable reports={urgentReports} onToggleUrgent={markUrgent} urgent />
          </div>
        )}

        <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground mb-2">
          {urgentReports.length > 0 ? "Other reports" : "All reports"}
        </div>
        <ReportTable reports={normalReports} onToggleUrgent={markUrgent} urgent={false} />
      </section>

      {/* ── Refund Manager ────────────────────────────────────── */}
      <section className="mb-8">
        <SectionLabel icon={DollarSign} title={`Refund Requests (${refundRequests.length})`} />
        
        {refundRequests.length === 0 ? (
          <div className="px-4 py-6 text-xs font-tech text-muted-foreground">No refund requests pending.</div>
        ) : (
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Request ID</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">User</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Reason</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Date</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {refundRequests.map((req) => (
                  <tr key={req.request_id} className="border-b border-border/60 hover:bg-secondary/30">
                    <td className="px-4 py-2 font-tech text-[10px] truncate max-w-[120px]">{req.request_id.slice(0, 12)}...</td>
                    <td className="px-4 py-2 font-tech text-[10px] truncate max-w-[100px]">{req.user_id?.slice(0, 12) || '—'}</td>
                    <td className="px-4 py-2 font-tech">${Number(req.amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-2 text-muted-foreground truncate max-w-[200px]">{req.reason || '—'}</td>
                    <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{req.created_at?.slice(0, 10)}</td>
                    <td className="px-4 py-2">
                      <div className="flex gap-1">
                        <Button size="sm" variant="default" onClick={() => approveRefund(req.request_id)} disabled={refundLoading}>
                          Approve
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => denyRefund(req.request_id)} disabled={refundLoading}>
                          Deny
                        </Button>
                      </div>
                    </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
        )}
      </section>

      {/* ── User Management Dashboard ────────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionLabel icon={Users} title="User Management" />
        
        <div className="mb-4">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent"
            />
            <Button type="submit" size="sm">
              Search
            </Button>
          </form>
        </div>
        
        {searchResults.length > 0 ? (
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">User ID</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Role</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {searchResults.map((user) => (
                  <tr key={user.user_id} className="border-b border-border/60 hover:bg-secondary/30">
                    <td className="px-4 py-2 font-tech text-[10px] truncate max-w-[140px]">{user.user_id}</td>
                    <td className="px-4 py-2 font-tech text-[10px] truncate max-w-[120px]">
                      {user.role || 'user'}
                    </td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-tech uppercase tracking-wider ${user.is_verified ? "bg-primary/10 text-primary" : "bg-gray-200"}`}>
                        {user.is_verified ? "Verified" : "Unverified"} 
                      </span>
                    </td>
                    <td className="px-4 py-2 flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => triggerVerification(user.user_id)}>
                        {user.is_verified ? "Unverify" : "Verify"}
                      </Button>
                      <MoreVertical size="sm" variant="outline">
                        <Menu className="origin-top-right">
                          <div className="px-1 py-0.5 rounded-md text-sm bg-secondary hover:bg-secondary/20">
                            <MenuItem onClick={() => suspendUser(user.user_id, "suspension", "permanent")}>
                              Suspend
                            </MenuItem>
                            <MenuItem onClick={() => terminateUser(user.user_id, "user misuse")}>
                              Terminate
                            </MenuItem>
                            <MenuItem onClick={() => awardMedal(user.user_id, "gold", "top contributor")}>
                              Award Gold
                            </MenuItem>
                          </div>
                        </Menu>
                      </MoreVertical>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="px-4 py-6 text-xs font-tech text-muted-foreground">No users found.</div>
        )}
      </section>

      {/* ── Support Messages / DMs ────────────────────────────────── */}
      <section className="mb-8">
        <SectionLabel icon={Mail} title="Support Messages" />

        {supportMessages.length > 0 ? (
          <div className="border border-border rounded-xl bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground mb-2">
                {supportMessages.length} message{supportMessages.length !== 1 ? 's' : ''} awaiting response
              </div>
              <div className="space-y-3">
                {supportMessages.map((msg) => (
                  <div key={msg.message_id} className="px-4 py-3 border-b border-border/60 last:border-b-0 hover:bg-secondary/30">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0">
                        <Mail className="h-3.5 w-3.5 text-accent mt-0.5" strokeWidth={1.5} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="font-display text-sm font-medium">{msg.sender_name}</span>
                          <span className="text-[10px] font-tech text-muted-foreground">
                            • {new Date(msg.created_at).toLocaleString()}
                          </span>
                          {!msg.is_read && (
                            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-tech uppercase tracking-wider bg-primary/10 text-primary">
                              NEW
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground line-clamp-3">{msg.content}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="px-4 py-6 text-xs font-tech text-muted-foreground text-center">
            No support messages awaiting response.
          </div>
        )}
      </section>

      {/* ── Most-Reported Listings / Users ───────────────────────────── */}
      <section className="mb-8">
        <SectionLabel icon={Flag} title="Most-Reported Listings & Users" />
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          {mostReported.length === 0 ? (
            <div className="px-4 py-6 text-xs font-tech text-muted-foreground">No targets with 2+ reports.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Target ID</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Type</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Reports</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Latest</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Top Reason</th>
                </tr>
              </thead>
              <tbody>
                {mostReported.map((r, i) => (
                  <tr key={i} className="border-b border-border/60 hover:bg-secondary/30">
                    <td className="px-4 py-2 font-tech truncate max-w-[140px]">{r.target_id}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-tech uppercase tracking-wider ${r.target_type === "seller" ? "bg-destructive/10 text-destructive" : "bg-primary/10 text-primary"}`}>
                        {r.target_type}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-tech font-medium text-destructive">{r.count}</td>
                    <td className="px-4 py-2 text-muted-foreground">{r.latest?.slice(0, 10)}</td>
                    <td className="px-4 py-2 text-muted-foreground truncate max-w-[200px]">{r.top_reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Hyperspace Trend ─────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionLabel icon={TrendingUp} title="Hyperspace Signups (30 days)" />
        <MetricPanel title="">
          {hyperspaceTrend.slice(-14).map((r) => (
            <div key={r.date} className="grid grid-cols-[72px_1fr_1fr_56px] items-center gap-2">
              <div className="text-[10px] font-tech text-muted-foreground">{r.date.slice(5)}</div>
              <div className="h-4 bg-secondary rounded-xl overflow-hidden">
                <div className="h-full bg-accent/50" style={{ width: `${Math.max(2, Math.round((r.initiated / maxHyperspace) * 100))}%` }} />
              </div>
              <div className="h-4 bg-secondary rounded-xl overflow-hidden">
                <div className="h-full bg-accent" style={{ width: `${Math.max(2, Math.round((r.completed / maxHyperspace) * 100))}%` }} />
              </div>
              <div className="text-right text-[10px] font-tech text-muted-foreground">
                {r.completed}/{r.initiated}
              </div>
            </div>
          ))}
          <div className="flex items-center gap-4 mt-2 text-[10px] font-tech text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="inline-block w-3 h-2 rounded-sm bg-accent/50" /> Initiated</span>
            <span className="inline-flex items-center gap-1.5"><span className="inline-block w-3 h-2 rounded-sm bg-accent" /> Completed</span>
          </div>
        </MetricPanel>
      </section>

      {/* ── Cascade Analysis ────────────────────────────────────────── */}
        {cascadeSuggestions.length > 0 && (
          <section className="mb-8">
            <SectionLabel icon={TrendingUp} title="Cascade Analysis" />
            <div className="border border-border rounded-xl bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground mb-2">
                  Potential Warning Cascade Detected
                </div>
                <ul className="py-2">
                  {cascadeSuggestions.map((s, i) => (
                    <li key={i} className="px-2 py-1 border-b border-border/60 hover:bg-secondary/30">
                      <div className="overflow-hidden">
                        <div className="text-sm text-muted-foreground truncate max-w-[200px]">Case {i + 1}: {s?.target_user?.warning_reason}</div>
                        <div className="text-xs text-accent">↗ {s?.status?.$count || '👁️'} similar alerts</div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}
      <section className="mb-8">
        <SectionLabel icon={CreditCard} title={`Stuck Transactions (>2h, ${stuckTxns.length})`} />
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          {stuckTxns.length === 0 ? (
            <div className="px-4 py-6 text-xs font-tech text-muted-foreground">No stuck transactions — all checkouts resolved.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Transaction ID</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Purpose</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Amount</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Started</th>
                </tr>
              </thead>
              <tbody>
                {stuckTxns.map((t) => (
                  <tr key={t.transaction_id} className="border-b border-border/60 hover:bg-secondary/30">
                    <td className="px-4 py-2 font-tech text-[10px] truncate max-w-[140px]">{t.transaction_id}</td>
                    <td className="px-4 py-2 capitalize">{t.purpose || "listing"}</td>
                    <td className="px-4 py-2 font-tech">${Number(t.amount || 0).toFixed(2)}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-tech uppercase tracking-wider bg-amber-500/10 text-amber-500">
                        {t.payment_status || t.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-muted-foreground">{t.created_at?.slice(0, 16).replace("T", " ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Notification Settings ────────────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionLabel icon={Mail} title="Notification Settings" />
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          <div className="p-4 space-y-4">
            {Object.entries(notificationSettings).map(([key, value]) => (
              <label key={key} className="flex items-center justify-between">
                <span className="font-tech text-xs uppercase tracking-wider text-muted-foreground">
                  {key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
                <input
                  type="checkbox"
                  checked={value}
                  onChange={(e) => handleNotificationChange(key, e.target.checked)}
                  className="w-4 h-4 text-primary border-border rounded focus:ring-primary"
                />
              </label>
            ))}
          </div>
        </div>
      </section>

      {/* ── Admin Audit Logs ────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionLabel icon={Shield} title="Admin Audit Logs" />
        <div className="border border-border rounded-xl bg-card overflow-hidden">
          {auditLoading ? (
            <div className="px-4 py-6 text-xs font-tech text-muted-foreground text-center">Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="px-4 py-6 text-xs font-tech text-muted-foreground text-center">No audit logs available.</div>
          ) : (
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Timestamp</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Admin</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Action</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Target</th>
                  <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Details</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((log, i) => (
                  <tr key={i} className="border-b border-border/60 hover:bg-secondary/30">
                    <td className="px-4 py-2 text-muted-foreground">{log.timestamp?.slice(0, 19).replace('T', ' ')}</td>
                    <td className="px-4 py-2 font-tech text-[10px] truncate max-w-[100px]">{log.admin_id}</td>
                    <td className="px-4 py-2">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-tech uppercase tracking-wider bg-secondary text-foreground/70">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-tech text-[10px] truncate max-w-[120px]">{log.target_id}</td>
                    <td className="px-4 py-2 text-muted-foreground truncate max-w-[200px]">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* ── Security Cleanup ────────────────────────────────────────────────────── */}
      <section className="mb-8">
        <SectionLabel icon={ShieldAlert} title="Security Cleanup" />
        <div className="border border-border rounded-xl bg-card p-6 space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="destructive" onClick={() => runCleanup('expired_sessions')}>
              <ShieldCheck className="h-3 w-3 mr-1" /> Purge Expired Sessions
            </Button>
            <span className="text-xs font-tech text-muted-foreground">Removes sessions older than 30 days</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="destructive" onClick={() => runCleanup('unverified_accounts')}>
              <ShieldCheck className="h-3 w-3 mr-1" /> Clean Unverified Accounts
            </Button>
            <span className="text-xs font-tech text-muted-foreground">Removes accounts unverified for 90+ days</span>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="destructive" onClick={() => runCleanup('old_reports')}>
              <ShieldCheck className="h-3 w-3 mr-1" /> Archive Old Reports
            </Button>
            <span className="text-xs font-tech text-muted-foreground">Archives resolved reports older than 1 year</span>
          </div>
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SectionLabel({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <Icon className="h-3.5 w-3.5 text-accent" strokeWidth={1.5} />
      <span className="text-[10px] font-tech uppercase tracking-[0.25em] text-muted-foreground">{title}</span>
    </div>
  );
}

function StatCard({ label, value, accent = false }) {
  return (
    <div className="border border-border rounded-xl bg-card p-4">
      <div className="text-[9px] font-tech uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
      <div className={`font-display text-2xl font-medium tracking-tight ${accent ? "text-primary" : ""}`}>
        {value ?? "…"}
      </div>
    </div>
  );
}

function MetricPanel({ title, children }) {
  return (
    <section className="border border-border rounded-xl p-4 bg-card">
      {title && <h2 className="font-tech text-xs uppercase tracking-wider text-muted-foreground mb-3">{title}</h2>}
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function BarRow({ label, value, max, fixedSuffix = "", money = false }) {
  const width = Math.max(2, Math.round((value / (max || 1)) * 100));
  return (
    <div className="grid grid-cols-[88px_1fr_90px] items-center gap-2">
      <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground">{label.slice(5)}</div>
      <div className="h-5 bg-secondary rounded-xl overflow-hidden">
        <div className="h-full bg-primary/70" style={{ width: `${width}%` }} />
      </div>
      <div className="text-right text-xs font-tech">
        {money ? `$${Number(value || 0).toFixed(2)}` : `${Number(value || 0).toFixed(2).replace(/\.00$/, "")}${fixedSuffix}`}
      </div>
    </div>
  );
}

function ReportTable({ reports, onToggleUrgent, urgent }) {
  if (reports.length === 0) {
    return <div className="text-xs font-tech text-muted-foreground px-1 py-2">None.</div>;
  }
  return (
    <div className={`border rounded-xl bg-card overflow-hidden ${urgent ? "border-destructive/40" : "border-border"}`}>
      <table className="w-full text-xs">
        <thead>
          <tr className={`border-b text-left ${urgent ? "border-destructive/30 bg-destructive/5" : "border-border"}`}>
            <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Type</th>
            <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Target</th>
            <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Reporter</th>
            <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Reason</th>
            <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Date</th>
            <th className="px-4 py-2 font-tech text-[10px] uppercase tracking-wider text-muted-foreground">Priority</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((r) => (
            <tr key={r.report_id} className="border-b border-border/60 hover:bg-secondary/30">
              <td className="px-4 py-2">
                <span className="px-2 py-0.5 rounded-full text-[9px] font-tech uppercase tracking-wider bg-secondary text-foreground/70">
                  {r.target_type}
                </span>
              </td>
              <td className="px-4 py-2 font-tech text-[10px] truncate max-w-[120px]">{r.target_id}</td>
              <td className="px-4 py-2 truncate max-w-[100px]">{r.reporter_name}</td>
              <td className="px-4 py-2 text-muted-foreground truncate max-w-[200px]">{r.reason}</td>
              <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">{r.created_at?.slice(0, 10)}</td>
              <td className="px-4 py-2">
                <button
                  onClick={() => onToggleUrgent(r.report_id, r.is_urgent)}
                  className={`px-2 py-0.5 rounded-xl text-[9px] font-tech uppercase tracking-wider border transition-colors ${
                    r.is_urgent
                      ? "border-destructive/60 text-destructive bg-destructive/10 hover:bg-destructive/20"
                      : "border-border text-muted-foreground hover:border-destructive/40 hover:text-destructive"
                  }`}
                >
                  {r.is_urgent ? "Urgent" : "Mark urgent"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

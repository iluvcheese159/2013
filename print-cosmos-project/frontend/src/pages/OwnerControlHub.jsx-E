import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

const OUTREACH_TEMPLATE = "Hey [Name], saw your portfolio on [Platform]. Outdated sites take 30%+. We launched Print Cosmos-a creator-first marketplace where you keep up to 96.5% of your earnings. $0 listing fees. Let me know if you want an invite.";

export default function OwnerControlHub() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [safetyReports, setSafetyReports] = useState([]);
  const [refundRequests, setRefundRequests] = useState([]);
  const [reportContext, setReportContext] = useState(null);
  const [warningText, setWarningText] = useState("Policy warning from owner moderation");

  const [couponCode, setCouponCode] = useState("");
  const [couponPct, setCouponPct] = useState(15);
  const [couponExpiry, setCouponExpiry] = useState("");
  const [coupons, setCoupons] = useState([]);

  const [creatorName, setCreatorName] = useState("");
  const [platformName, setPlatformName] = useState("");
  const [outreachNotes, setOutreachNotes] = useState("");
  const [outreachEntries, setOutreachEntries] = useState([]);

  const loadAll = async () => {
    const [u, s, c, o, rr] = await Promise.all([
      api.get("/owner/users"),
      api.get("/owner/safety-reports"),
      api.get("/owner/coupons"),
      api.get("/owner/recruitment/outreach"),
      api.get("/owner/refund-requests"),
    ]);
    setUsers(u.data || []);
    setSafetyReports(s.data || []);
    setCoupons(c.data || []);
    setOutreachEntries(o.data || []);
    setRefundRequests(rr.data || []);
  };

  useEffect(() => {
    if (!user) return;
    if (!user.is_platform_owner) {
      toast.error("403 Forbidden Access");
      navigate("/", { replace: true });
      return;
    }
    loadAll().catch((e) => {
      if (e?.response?.status === 403) {
        toast.error("403 Forbidden Access");
        navigate("/", { replace: true });
        return;
      }
      toast.error("Owner hub failed to load");
    });
  }, [user, navigate]);

  const filteredUsers = useMemo(() => users.filter((u) => !u.is_platform_owner), [users]);

  const toggleVerification = async (uid) => {
    await api.post(`/owner/users/${uid}/toggle-verification`);
    await loadAll();
    toast.success("Verification status updated");
  };

  const issueWarning = async (uid) => {
    await api.post(`/owner/users/${uid}/warn`, { reason_text: warningText });
    await loadAll();
    toast.success("One-time warning issued");
  };

  const terminateProfile = async (uid) => {
    await api.post(`/owner/users/${uid}/terminate`);
    await loadAll();
    toast.success("Profile terminated");
  };

  const markResolved = async (rid) => {
    await api.post(`/owner/safety-reports/${rid}/resolve`);
    await loadAll();
  };

  const viewContext = async (rid) => {
    const r = await api.get(`/owner/safety-reports/${rid}/context`);
    setReportContext(r.data);
  };

  const createCoupon = async () => {
    await api.post("/owner/coupons", {
      code: couponCode,
      discount_percent: Number(couponPct),
      expires_at: new Date(couponExpiry).toISOString(),
    });
    setCouponCode("");
    await loadAll();
    toast.success("Coupon created");
  };

  const copyOutreach = async () => {
    await navigator.clipboard.writeText(OUTREACH_TEMPLATE);
    toast.success("Outreach template copied");
  };

  const logOutreach = async () => {
    await api.post("/owner/recruitment/outreach", {
      creator_name: creatorName,
      platform_name: platformName,
      notes: outreachNotes,
    });
    setCreatorName("");
    setPlatformName("");
    setOutreachNotes("");
    await loadAll();
  };

  const sendRebrand = async () => {
    const r = await api.post("/owner/emails/rebrand-announcement");
    toast.success(`Mass email dispatch queued: ${r.data.sent}`);
  };

  const approveRefund = async (requestId) => {
    await api.post(`/owner/refund-requests/${requestId}/approve`);
    await loadAll();
    toast.success("Refund approved");
  };

  const denyRefund = async (requestId) => {
    await api.post(`/owner/refund-requests/${requestId}/deny`);
    await loadAll();
    toast.success("Refund denied");
  };

  if (!user) return null;

  return (
    <div className="pt-14 min-h-screen px-6 md:px-12 lg:px-24" data-testid="owner-control-page">
      <div className="text-xs font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">Owner Control</div>
      <h1 className="font-display text-4xl font-light mb-8">Owner User Control Management Hub</h1>

      <section className="border border-border rounded-xl p-4 bg-card mb-6">
        <h2 className="font-tech text-xs uppercase tracking-wider text-muted-foreground mb-3">Moderate Users Console</h2>
        <div className="mb-3">
          <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground">Warning Reason Text</label>
          <Input value={warningText} onChange={(e) => setWarningText(e.target.value)} className="mt-1" />
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="py-2">User Name</th>
                <th>User Tag</th>
                <th>Email</th>
                <th>Pro</th>
                <th>Verification</th>
                <th>Terms Enforcement</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u.user_id} className="border-b border-border/60">
                  <td className="py-2">{u.name}</td>
                  <td>{u.user_tag || "-"}</td>
                  <td>{u.email}</td>
                  <td>{u.is_pro ? "Yes" : "No"}</td>
                  <td>{u.verification_status}</td>
                  <td>{u.terms_enforcement_status}</td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => toggleVerification(u.user_id)}>Toggle Verification</Button>
                      <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => issueWarning(u.user_id)}>Issue One-Time Warning</Button>
                      <Button size="sm" className="h-7 text-[10px] bg-destructive hover:bg-destructive/90" onClick={() => terminateProfile(u.user_id)}>Terminate Profile</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-border rounded-xl p-4 bg-card mb-6">
        <h2 className="font-tech text-xs uppercase tracking-wider text-muted-foreground mb-3">Secure User Safety Report Log</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {safetyReports.map((r) => (
              <div key={r.report_id} className="border border-border rounded-xl p-2 text-xs">
                <div className="font-medium">{r.report_type} · {r.reason_category}</div>
                <div className="text-muted-foreground">Target: {r.reported_target_id}</div>
                <div className="text-muted-foreground">Status: {r.status}</div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => markResolved(r.report_id)}>Mark Resolved</Button>
                  <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => viewContext(r.report_id)}>View Context</Button>
                </div>
              </div>
            ))}
          </div>
          <div className="border border-border rounded-xl p-3 bg-background">
            <div className="font-tech text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Context Preview</div>
            <pre className="text-[11px] whitespace-pre-wrap break-all">{reportContext ? JSON.stringify(reportContext, null, 2) : "Select a report context."}</pre>
          </div>
        </div>
      </section>

      <section className="border border-border rounded-xl p-4 bg-card mb-6">
        <h2 className="font-tech text-xs uppercase tracking-wider text-muted-foreground mb-3">Algorithmic Fallback Refund Queue</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left border-b border-border">
                <th className="py-2">Request ID</th>
                <th>Transaction</th>
                <th>Listing</th>
                <th>Provider</th>
                <th>Status</th>
                <th>Reason</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {refundRequests.map((r) => (
                <tr key={r.request_id} className="border-b border-border/60">
                  <td className="py-2">{r.request_id}</td>
                  <td>{r.transaction_id}</td>
                  <td>{r.listing_id}</td>
                  <td>{r.payment_provider || "-"}</td>
                  <td>{r.status}</td>
                  <td>{r.reason}</td>
                  <td>
                    {r.status === "pending_owner_review" ? (
                      <div className="flex gap-1">
                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => approveRefund(r.request_id)}>Approve</Button>
                        <Button size="sm" variant="outline" className="h-7 text-[10px]" onClick={() => denyRefund(r.request_id)}>Deny</Button>
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="border border-border rounded-xl p-4 bg-card mb-6">
        <h2 className="font-tech text-xs uppercase tracking-wider text-muted-foreground mb-3">Admin One-Time Discount Coupon Generator</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
          <Input value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Coupon Code Name" />
          <div className="border border-border rounded-xl px-3 py-2">
            <label className="text-[10px] uppercase tracking-wider font-tech text-muted-foreground">Discount Percentage: {couponPct}%</label>
            <input type="range" min="1" max="100" value={couponPct} onChange={(e) => setCouponPct(Number(e.target.value))} className="w-full" />
          </div>
          <Input type="date" value={couponExpiry} onChange={(e) => setCouponExpiry(e.target.value)} />
        </div>
        <Button onClick={createCoupon} className="text-xs uppercase tracking-wider">Save Coupon</Button>
        <div className="mt-4 space-y-1">
          {coupons.map((c) => (
            <div key={c.coupon_id || c.code} className="text-xs border border-border rounded-xl px-2 py-1">{c.code} · {c.discount_percent}% · expires {String(c.expires_at).slice(0, 10)}</div>
          ))}
        </div>
      </section>

      <section className="border border-border rounded-xl p-4 bg-card mb-10">
        <h2 className="font-tech text-xs uppercase tracking-wider text-muted-foreground mb-3">Administrative Communications & CRM</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="border border-border rounded-xl p-3">
            <div className="font-tech text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Recruitment Template Clipboard</div>
            <Textarea rows={6} value={OUTREACH_TEMPLATE} readOnly className="mb-2" />
            <Button variant="outline" onClick={copyOutreach} className="text-xs uppercase tracking-wider">Copy Template</Button>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              <Input value={creatorName} onChange={(e) => setCreatorName(e.target.value)} placeholder="Creator Name" />
              <Input value={platformName} onChange={(e) => setPlatformName(e.target.value)} placeholder="Platform" />
            </div>
            <Textarea className="mt-2" rows={2} value={outreachNotes} onChange={(e) => setOutreachNotes(e.target.value)} placeholder="Loop notes" />
            <Button onClick={logOutreach} className="mt-2 text-xs uppercase tracking-wider">Log Outreach Loop</Button>
            <div className="mt-2 text-[11px] text-muted-foreground">Logged loops: {outreachEntries.length}</div>
          </div>

          <div className="border border-border rounded-xl p-3">
            <div className="font-tech text-[10px] uppercase tracking-wider text-muted-foreground mb-2">Rebranding Announcement Utility</div>
            <Textarea
              rows={8}
              readOnly
              value={"Subject: Welcome to Print Cosmos! (Major Update) Hello [Username], we have officially evolved! To better represent our growing community of 3D designers and makers, PrintForge has rebranded to Print Cosmos. Your existing account credentials, designs, portfolios, and connected payment channels remain completely secure and unchanged. Log in today to check out our upgraded high-speed interface, lower commission options, and advanced 3D modeling toolbox updates. Happy making! - The Print Cosmos Team"}
            />
            <Button onClick={sendRebrand} className="mt-2 text-xs uppercase tracking-wider">Send Mass Rebrand Email</Button>
          </div>
        </div>
      </section>
    </div>
  );
}

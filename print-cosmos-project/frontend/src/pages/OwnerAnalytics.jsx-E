import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";

export default function OwnerAnalytics() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);

  useEffect(() => {
    if (!user) return;
    if (!user.is_platform_owner) {
      toast.error("403 Forbidden Access");
      navigate("/", { replace: true });
      return;
    }
    api.get("/owner/analytics")
      .then((r) => setRows(r.data?.metrics || []))
      .catch((e) => {
        if (e?.response?.status === 403) {
          toast.error("403 Forbidden Access");
          navigate("/", { replace: true });
          return;
        }
        toast.error("Failed to load analytics");
      });
  }, [user, navigate]);

  const maxDownloads = useMemo(() => Math.max(1, ...rows.map((r) => Number(r.daily_downloads || 0))), [rows]);
  const maxRevenue = useMemo(() => Math.max(1, ...rows.map((r) => Number(r.gross_revenue || 0))), [rows]);

  if (!user) return null;

  return (
    <div className="pt-14 min-h-screen px-6 md:px-12 lg:px-24" data-testid="owner-analytics-page">
      <div className="text-xs font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">Owner Analytics</div>
      <h1 className="font-display text-4xl font-light mb-8">Privatized Platform Analytics Dashboard</h1>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
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
    </div>
  );
}

function MetricPanel({ title, children }) {
  return (
    <section className="border border-border rounded-xl p-4 bg-card">
      <h2 className="font-tech text-xs uppercase tracking-wider text-muted-foreground mb-3">{title}</h2>
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

import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { AlertCircle, CheckCircle, X } from "lucide-react";

export default function WarningBanner() {
  const { user } = useAuth();
  const [isWarningVisible, setIsWarningVisible] = useState(false);
  const [warningTime, setWarningTime] = useState(0);
  const [warningData, setWarningData] = useState(null);
  const [isResolving, setIsResolving] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    const checkForWarning = async () => {
      if (!user || user.is_platform_owner) return;

      try {
        const response = await api.get('/admin/user-status');
        const userStatus = response.data;

        if (
          userStatus.enforcement_status === 'Warned' &&
          (!isWarningVisible || (Date.now() - warningTime) > 300000)
        ) {
          setIsWarningVisible(true);
          setWarningTime(Date.now());
          setWarningData(userStatus);

          timerRef.current = setTimeout(() => {
            setIsWarningVisible(false);
          }, 8000);
        }
      } catch (err) {
        console.debug('Warning check failed:', err);
      }
    };

    checkForWarning();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [user, warningTime, isWarningVisible]);

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsWarningVisible(false);
  };

  const handleAcknowledge = async () => {
    if (!warningData || isResolving) return;
    setIsResolving(true);

    try {
      await api.post('/admin/warnings/resolve', {
        user_id: user.user_id,
      });
      dismiss();
    } catch (err) {
      console.warn('Failed to resolve warning:', err);
    } finally {
      setIsResolving(false);
    }
  };

  if (!isWarningVisible || !warningData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative max-w-lg w-full bg-surface border border-red-500/30 rounded-xl shadow-2xl mx-4 overflow-hidden">
        <button
          onClick={dismiss}
          className="absolute top-3 right-3 p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-border/50 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4 p-6">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-500" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="font-display text-lg font-medium text-foreground">System Alert</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {warningData.warning_message || "Your account requires attention."}
            </p>

            <div className="mt-4 p-3 bg-red-500/5 border border-red-500/20 rounded-lg">
              <p className="text-xs text-muted-foreground leading-relaxed">
                The platform has issued you a warning due to:{' '}
                <span className="text-red-400 font-medium">
                  {warningData.reason || 'policy violations detected'}
                </span>.
                Please review and comply with platform guidelines. Ignoring warnings may result in account restrictions.
              </p>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground">
                Status:{' '}
                <span className={warningData.enforcement_status === 'Warned' ? 'text-red-400' : 'text-green-400'}>
                  {warningData.enforcement_status === 'Warned' ? 'ACTIVE' : 'RESOLVED'}
                </span>
              </span>

              <div className="flex gap-2">
                <button
                  onClick={dismiss}
                  className="px-3 py-1.5 text-xs font-tech uppercase tracking-wider text-muted-foreground hover:text-foreground border border-border rounded-lg hover:bg-border/30 transition-colors"
                >
                  Dismiss
                </button>
                <button
                  onClick={handleAcknowledge}
                  disabled={isResolving}
                  className="px-4 py-1.5 text-xs font-tech uppercase tracking-wider text-white bg-red-600 hover:bg-red-700 disabled:bg-red-800/50 rounded-lg transition-colors inline-flex items-center gap-1.5"
                >
                  {isResolving ? (
                    <>Processing&hellip;</>
                  ) : (
                    <><CheckCircle className="h-3 w-3" /> Acknowledge</>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
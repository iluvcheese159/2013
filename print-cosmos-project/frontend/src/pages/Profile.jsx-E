/* eslint-disable */
import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api, fileUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Sparkles, Upload, User as UserIcon, Briefcase, Circle, Check, Flag, Eye, Star, Medal, Trophy, Shield } from "lucide-react";
import UserBadges, { MILESTONE_META } from "@/components/UserBadges";
import SafeImage from "@/components/SafeImage";
import MilestoneBadge3D from "@/components/MilestoneBadge3D";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const TYPES = [
  { id: "personal", label: "Personal", icon: UserIcon },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "neutral", label: "Neutral", icon: Circle },
];

export default function Profile() {
  const { userId } = useParams();
  const { user, setUser, openAuth } = useAuth();
  const isPublicProfile = Boolean(userId && userId !== user?.user_id);
  const [publicProfile, setPublicProfile] = useState(null);
  const [publicListings, setPublicListings] = useState([]);
  const [profileTab, setProfileTab] = useState("listings");
  const [name, setName] = useState("");
  const [userTag, setUserTag] = useState("");
  const [description, setDescription] = useState("");
  const [accountType, setAccountType] = useState("neutral");
  const [picture, setPicture] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [kycBusy, setKycBusy] = useState(false);
  const [termsBusy, setTermsBusy] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setUserTag(user.user_tag || "");
      setDescription(user.description || "");
      setAccountType(user.account_type || "neutral");
      setPicture(user.picture || null);
    }
  }, [user]);

  useEffect(() => {
    if (!isPublicProfile || !userId) return;
    api.get(`/profile/${userId}`).then((r) => setPublicProfile(r.data)).catch(() => setPublicProfile(null));
    api.get(`/users/${userId}/listings`).then((r) => setPublicListings(r.data || [])).catch(() => setPublicListings([]));
  }, [isPublicProfile, userId]);

  useEffect(() => {
    if (!user || isPublicProfile) return;
    api.get("/payments/onboarding/status").then((r) => setPaymentStatus(r.data)).catch(() => setPaymentStatus(null));
  }, [user?.user_id, isPublicProfile]);

  const step1Done = Boolean(paymentStatus?.stripe?.ready || paymentStatus?.paypal?.ready);
  const step2Done = user?.verification_status === "Verified";
  const step3Done = Boolean(user?.agreed_platform_terms);

  useEffect(() => {
    if (!user || user.is_seller) return;
    if (!(step1Done && step2Done && step3Done)) return;
    api.post("/auth/become-seller").then((r) => setUser(r.data)).catch(() => {});
  }, [user?.user_id, user?.is_seller, step1Done, step2Done, step3Done, setUser]);

  const reportProfileSeller = async () => {
    if (!user) {
      openAuth("signin");
      return;
    }
    const reason = prompt("Report this seller profile — please tell us why:");
    if (!reason || !reason.trim() || !publicProfile?.user_id) return;
    try {
      await api.post("/reports", { target_type: "seller", target_id: publicProfile.user_id, reason });
      toast.success("Seller reported");
    } catch {
      toast.error("Could not report seller");
    }
  };

  if (isPublicProfile) {
    if (!publicProfile) {
      return <div className="pt-24 px-6 md:px-12 text-sm text-muted-foreground">Loading profile...</div>;
    }
    const terminated = publicProfile.enforcement_status === "Terminated";
    return (
      <div className="pt-20 min-h-screen px-6 md:px-12 py-10 max-w-5xl" data-testid="public-profile-page">
        {terminated ? (
          <div className="border border-destructive/40 bg-destructive/10 text-destructive rounded-xl p-6 text-sm font-tech">
            This user profile has been permanently banned by the Moderator for violations of the Print Cosmos Terms of Service.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-4 mb-8">
              <Avatar className="h-20 w-20 border border-border">
                <AvatarImage src={publicProfile.picture} alt={publicProfile.name} />
                <AvatarFallback>{publicProfile.name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-3xl font-medium">{publicProfile.name}</h1>
                  <UserBadges isPro={publicProfile.is_pro} isPlatformOwner={publicProfile.is_platform_owner} milestoneBadges={publicProfile.milestone_badges} />
                  <button
                    data-testid="profile-report-seller-btn"
                    onClick={reportProfileSeller}
                    className="inline-flex items-center gap-1 px-2 py-1 border border-border rounded-xl text-[10px] font-tech uppercase tracking-wider hover:border-destructive hover:text-destructive"
                  >
                    <Flag className="h-3 w-3" /> Report
                  </button>
                </div>
                <div className="text-xs text-muted-foreground">@{publicProfile.user_tag || "no_tag"}</div>
                <div className="text-sm text-muted-foreground mt-2 max-w-2xl">{publicProfile.description || "No profile description yet."}</div>
              </div>
            </div>

            {/* Instagram-style tabs */}
            <div className="flex border-b border-border mb-6" data-testid="profile-tabs">
              <button
                onClick={() => setProfileTab("listings")}
                data-testid="profile-tab-listings"
                className={`px-5 py-3 text-[11px] font-tech uppercase tracking-[0.2em] border-b-2 -mb-px transition-colors ${
                  profileTab === "listings" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Listings
              </button>
              <button
                onClick={() => setProfileTab("badges")}
                data-testid="profile-tab-badges"
                className={`px-5 py-3 text-[11px] font-tech uppercase tracking-[0.2em] border-b-2 -mb-px transition-colors ${
                  profileTab === "badges" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Badges
              </button>
            </div>

            {profileTab === "listings" ? (
              publicListings.length ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2">
                  {publicListings.map((listing) => (
                    <Link
                      key={listing.listing_id}
                      to={`/listing/${listing.listing_id}`}
                      data-testid={`profile-listing-${listing.listing_id}`}
                      className="relative aspect-square bg-secondary overflow-hidden rounded-xl group block"
                    >
                      {listing.image_paths?.[0] ? (
                        <SafeImage src={fileUrl(listing.image_paths[0])} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : null}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/0 to-black/0 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center pb-3 gap-4 text-white text-xs font-tech">
                        <span className="inline-flex items-center gap-1">
                          <Eye className="h-3.5 w-3.5" /> {listing.view_count || 0}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Star className="h-3.5 w-3.5 fill-current" /> {listing.rating_avg ? listing.rating_avg.toFixed(1) : "—"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-16 font-tech uppercase tracking-wider">No listings yet</div>
              )
            ) : (
              <BadgesTab profile={publicProfile} />
            )}
          </>
        )}
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-24 px-6 md:px-12 text-center">
        <h1 className="font-display text-3xl font-medium mb-4">Sign in to edit your profile</h1>
        <Button data-testid="profile-signin-btn" onClick={() => openAuth("signin")} className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider">
          Sign in
        </Button>
      </div>
    );
  }

  const uploadPicture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const r = await api.post("/upload", form, { headers: { "Content-Type": "multipart/form-data" } });
      const url = `${process.env.REACT_APP_BACKEND_URL}/api/files/${r.data.path}`;
      setPicture(url);
      toast.success("Picture uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const beginStripeOnboarding = async () => {
    try {
      const r = await api.post("/payments/stripe/connect/onboard", { origin_url: window.location.origin });
      window.location.href = r.data.onboarding_url;
    } catch {
      toast.error("Could not start Stripe onboarding");
    }
  };

  const beginPayPalOnboarding = async () => {
    try {
      const r = await api.post("/payments/paypal/onboard", { origin_url: window.location.origin });
      window.location.href = r.data.onboarding_url;
    } catch {
      toast.error("Could not start PayPal onboarding");
    }
  };

  const completeKyc = async () => {
    setKycBusy(true);
    try {
      const r = await api.put("/profile", { verification_status: "Verified" });
      setUser(r.data);
      toast.success("Identity verification marked complete");
    } catch {
      toast.error("Could not complete KYC step");
    } finally {
      setKycBusy(false);
    }
  };

  const agreePlatformTerms = async () => {
    setTermsBusy(true);
    try {
      const r = await api.put("/profile", { agreed_platform_terms: true });
      setUser(r.data);
      toast.success("Platform terms agreement recorded");
    } catch {
      toast.error("Could not record terms agreement");
    } finally {
      setTermsBusy(false);
    }
  };

  const save = async () => {
    setSaving(true);
    try {
      const r = await api.put("/profile", {
        name,
        user_tag: userTag || null,
        description: description || null,
        picture,
        account_type: accountType,
      });
      setUser(r.data);
      toast.success("Profile saved");
    } catch (e) {
      const detail = e?.response?.data?.detail;
      toast.error(typeof detail === "string" ? detail : "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div data-testid="profile-page" className="pt-20 min-h-screen">
      <div className="px-6 md:px-12 py-10 max-w-3xl">
        <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">
          <span className="text-primary">●</span> Profile
        </div>
        <h1 className="font-display text-4xl font-medium tracking-tighter mb-10">Edit your profile</h1>

        <div className="border border-border rounded-xl p-5 mb-8 bg-card">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <div className="font-display text-2xl font-medium tracking-tight">Seller Bank Verification</div>
              <div className="text-xs text-muted-foreground">Complete all onboarding stages to unlock seller publishing eligibility.</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded-full text-[9px] font-tech uppercase tracking-wider border ${step1Done ? "text-emerald-500 border-emerald-500/40" : "text-muted-foreground border-border"}`}>Bank {step1Done ? "Ready" : "Pending"}</span>
              <span className={`px-2 py-1 rounded-full text-[9px] font-tech uppercase tracking-wider border ${step2Done ? "text-emerald-500 border-emerald-500/40" : "text-muted-foreground border-border"}`}>KYC {step2Done ? "Verified" : "Pending"}</span>
              <span className={`px-2 py-1 rounded-full text-[9px] font-tech uppercase tracking-wider border ${step3Done ? "text-emerald-500 border-emerald-500/40" : "text-muted-foreground border-border"}`}>Terms {step3Done ? "Agreed" : "Pending"}</span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="pl-4 border-l-2 border-border">
              <div className="text-sm font-medium">1. Link Bank Account</div>
              <div className="text-xs text-muted-foreground mb-2">Connect Stripe or PayPal payout rails.</div>
              {!step1Done ? (
                <div className="flex items-center gap-2">
                  <Button onClick={beginStripeOnboarding} size="sm" className="rounded-xl font-tech text-[10px] uppercase tracking-wider">Link Stripe</Button>
                  <Button onClick={beginPayPalOnboarding} size="sm" variant="outline" className="rounded-xl font-tech text-[10px] uppercase tracking-wider">Link PayPal</Button>
                </div>
              ) : <div className="text-xs text-emerald-500">Completed</div>}
            </div>

            <div className="pl-4 border-l-2 border-border">
              <div className="text-sm font-medium">2. Identity Verification (KYC)</div>
              <div className="text-xs text-muted-foreground mb-2">Verify identity to satisfy compliance controls.</div>
              {!step2Done ? (
                <Button onClick={completeKyc} disabled={kycBusy} size="sm" className="rounded-xl font-tech text-[10px] uppercase tracking-wider">
                  {kycBusy ? "Completing..." : "Complete KYC"}
                </Button>
              ) : <div className="text-xs text-emerald-500">Completed</div>}
            </div>

            <div className="pl-4 border-l-2 border-border">
              <div className="text-sm font-medium">3. Agree to Platform Terms</div>
              <div className="text-xs text-muted-foreground mb-2">Confirm platform terms before storage/seller unlocks.</div>
              {!step3Done ? (
                <Button onClick={agreePlatformTerms} disabled={termsBusy} size="sm" className="rounded-xl font-tech text-[10px] uppercase tracking-wider">
                  {termsBusy ? "Saving..." : "Agree to Terms"}
                </Button>
              ) : <div className="text-xs text-emerald-500">Completed</div>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6 mb-10 pb-10 border-b border-border">
          <Avatar className="h-24 w-24 border-2 border-border">
            <AvatarImage src={picture} alt={name} />
            <AvatarFallback className="bg-secondary text-2xl">{name?.[0]?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div>
            <label className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-xl cursor-pointer hover:border-primary text-xs font-tech uppercase tracking-wider">
              <Upload className="h-3.5 w-3.5" /> {uploading ? "Uploading…" : "Change picture"}
              <input data-testid="profile-picture-input" type="file" accept="image/*" onChange={uploadPicture} className="hidden" />
            </label>
            <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground mt-2">JPG / PNG / WebP</div>
          </div>
          {user.is_pro && (
            <div className="ml-auto inline-flex items-center gap-1.5 px-3 py-1.5 bg-accent/10 border border-accent/30 text-accent rounded-full text-[10px] font-tech uppercase tracking-wider">
              <Sparkles className="h-3 w-3" /> Pro member
            </div>
          )}
        </div>

        <div className="space-y-6">
          <Field label="Name">
            <Input data-testid="profile-name-input" value={name} onChange={(e) => setName(e.target.value)} className="font-tech rounded-xl" />
          </Field>
          <Field label="User tag">
            <Input
              data-testid="profile-user-tag-input"
              value={userTag}
              onChange={(e) => setUserTag(e.target.value.replace(/[^a-zA-Z0-9_]/g, ""))}
              placeholder="resin_ryan"
              className="font-tech rounded-xl"
              maxLength={20}
            />
          </Field>
          <Field label="Bio / description">
            <Textarea
              data-testid="profile-description-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Tell makers about yourself, your specialty, your printer setup…"
              rows={4}
              className="font-tech text-sm rounded-xl"
            />
          </Field>
          <Field label="Account type">
            <div className="grid grid-cols-3 gap-2">
              {TYPES.map((t) => {
                const active = accountType === t.id;
                return (
                  <button
                    key={t.id}
                    data-testid={`profile-type-${t.id}`}
                    onClick={() => setAccountType(t.id)}
                    className={`relative p-4 border rounded-xl text-left transition-all ${
                      active ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"
                    }`}
                  >
                    {active && <Check className="absolute top-2 right-2 h-3 w-3 text-primary" />}
                    <t.icon className={`h-4 w-4 mb-2 ${active ? "text-primary" : "text-muted-foreground"}`} strokeWidth={1.5} />
                    <div className="text-xs font-tech uppercase tracking-wider">{t.label}</div>
                  </button>
                );
              })}
            </div>
          </Field>
        </div>

        <div className="mt-10">
          <Button
            data-testid="profile-save-btn"
            onClick={save}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider"
          >
            {saving ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function BadgesTab({ profile }) {
  const [open3D, setOpen3D] = useState(null); // holds the milestone id currently shown in the 3D dialog
  const earned = [];

  if (profile?.is_platform_owner) {
    earned.push({ id: "owner", label: "Platform Owner", icon: Shield, color: "text-foreground", static: true });
  }
  if (profile?.is_pro) {
    earned.push({ id: "pro", label: "Pro Member", icon: Sparkles, color: "text-accent", static: true });
  }
  (profile?.milestone_badges || []).forEach((id) => {
    const meta = MILESTONE_META[id];
    if (meta) earned.push({ id, label: meta.label, icon: meta.icon, color: meta.color, static: false, kind: meta.kind });
  });

  if (!earned.length) {
    return <div className="text-sm text-muted-foreground text-center py-16 font-tech uppercase tracking-wider">No badges earned yet</div>;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {earned.map((b) => {
          const Icon = b.icon;
          return (
            <button
              key={b.id}
              type="button"
              disabled={b.static}
              onClick={() => !b.static && setOpen3D(b.id)}
              data-testid={`profile-badge-${b.id}`}
              className={`flex flex-col items-center gap-2 rounded-2xl bg-card shadow-sm p-5 text-center ${!b.static ? "hover:shadow-lg transition-shadow cursor-pointer" : "cursor-default"}`}
            >
              <Icon className={`h-8 w-8 ${b.color}`} fill={b.static ? "none" : "currentColor"} strokeWidth={1.3} />
              <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground">{b.label}</div>
              {!b.static && <div className="text-[9px] text-primary">View in 3D</div>}
            </button>
          );
        })}
      </div>

      <Dialog open={!!open3D} onOpenChange={(v) => !v && setOpen3D(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{open3D ? MILESTONE_META[open3D]?.label : ""}</DialogTitle>
          </DialogHeader>
          <div className="aspect-square bg-black rounded-xl overflow-hidden">
            {open3D && <MilestoneBadge3D kind={MILESTONE_META[open3D]?.kind} />}
          </div>
          <p className="text-xs text-muted-foreground text-center font-tech uppercase tracking-wider">Drag to rotate</p>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground mb-2">{label}</div>
      {children}
    </div>
  );
}

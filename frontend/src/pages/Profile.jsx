/* eslint-disable */
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api, fileUrl } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Sparkles, Upload, User as UserIcon, Briefcase, Circle, Check, Flag, Eye, Star, Medal, Trophy, Shield, Wrench, Search, Printer } from "lucide-react";
import UserBadges from "@/components/UserBadges";
import SafeImage from "@/components/SafeImage";
import MilestoneBadge3D from "@/components/MilestoneBadge3D";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PrinterModelSelector from "@/components/PrinterModelSelector";
import PRINTER_MODELS from "@/constants/printerModels";

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
  const [profileSkills, setProfileSkills] = useState([]);
  const [profileAwards, setProfileAwards] = useState([]);
  const [profileCollections, setProfileCollections] = useState([]);
  const [profileFailures, setProfileFailures] = useState([]);
  const [profileBoards, setProfileBoards] = useState([]);
  const [profileTab, setProfileTab] = useState("listings");
  const [name, setName] = useState("");
  const [userTag, setUserTag] = useState("");
  const [description, setDescription] = useState("");
  const [accountType, setAccountType] = useState("neutral");
  const [picture, setPicture] = useState(null);
  const [workingOn, setWorkingOn] = useState("");
  const [lookingFor, setLookingFor] = useState("");
  const [currentlyPrinting, setCurrentlyPrinting] = useState("");
  const [currentlyPrintingPercent, setCurrentlyPrintingPercent] = useState("");
  const [currentlyPrintingTimeRemaining, setCurrentlyPrintingTimeRemaining] = useState("");
  const [bio, setBio] = useState("");
  const [printerModel, setPrinterModel] = useState("");
  const [filamentType, setFilamentType] = useState("");
  const [skills, setSkills] = useState("");
  const [socialLinks, setSocialLinks] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [kycBusy, setKycBusy] = useState(false);
  const [termsBusy, setTermsBusy] = useState(false);

  // Ambient animation refs
  const pageRef = useRef(null);
  const timeRef = useRef(0);
  const frameRef = useRef(null);

  // Ambient auto-pulse for page elements
  useEffect(() => {
    let lastTime = 0;
    const animate = (time) => {
      lastTime = time;
      timeRef.current = time / 1000;
      frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setUserTag(user.user_tag || "");
      setDescription(user.description || "");
      setAccountType(user.account_type || "neutral");
      setPicture(user.picture || null);
      setWorkingOn(user.working_on || "");
      setLookingFor(user.looking_for || "");
      setCurrentlyPrinting(user.currently_printing || "");
      setCurrentlyPrintingPercent(user.currently_printing_percent != null ? String(user.currently_printing_percent) : "");
      setCurrentlyPrintingTimeRemaining(user.currently_printing_time_remaining || "");
      setBio(user.bio || "");
      setPrinterModel(user.printer_model || "");
      setFilamentType(user.filament_type || "");
      setSkills((user.skills || []).join(", "));
      const sl = user.social_links || {};
      setSocialLinks(Object.entries(sl).map(([k, v]) => `${k}: ${v}`).join("\n"));
    }
  }, [user]);

  useEffect(() => {
    if (!isPublicProfile || !userId) return;
    api.get(`/profile/${userId}`).then((r) => setPublicProfile(r.data)).catch(() => setPublicProfile(null));
    api.get(`/users/${userId}/listings`).then((r) => setPublicListings(r.data || [])).catch(() => setPublicListings([]));
  }, [isPublicProfile, userId]);

  useEffect(() => {
    if (!isPublicProfile || profileTab !== "collections" || !userId) {
      return;
    }
    api.get(`/users/${userId}/collections`).then((r) => setProfileCollections(r.data || [])).catch(() => setProfileCollections([]));
  }, [isPublicProfile, profileTab, userId]);

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
            <div className="flex items-center gap-4 mb-8 rise-in">
              <Avatar className="h-20 w-20 border border-border">
                <AvatarImage src={publicProfile.picture} alt={publicProfile.name} />
                <AvatarFallback>{publicProfile.name?.[0] || "U"}</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-display text-3xl font-medium">{publicProfile.name}</h1>
                  <UserBadges user={publicProfile} listings={publicListings} variant="profile" />
                  <button
                    data-testid="profile-report-seller-btn"
                    onClick={reportProfileSeller}
                    className="inline-flex items-center gap-1 px-2 py-1 border border-border rounded-xl text-[10px] font-tech uppercase tracking-wider hover:border-destructive hover:text-destructive"
                  >
                    <Flag className="h-3 w-3" /> Report
                  </button>
                </div>
                <div className="text-xs text-muted-foreground">@{publicProfile.user_tag || "no_tag"}</div>
                <div className="flex items-center gap-3 text-xs font-tech uppercase tracking-wider text-muted-foreground mt-1">
                  <span>{publicProfile.total_sales || 0} sold</span>
                  <span>·</span>
                  <span>{publicListings.length} listings</span>
                </div>
                <div className="text-sm text-muted-foreground mt-2 max-w-2xl">{publicProfile.description || "No profile description yet."}</div>
                {publicProfile.bio && (
                  <div className="mt-3 text-sm text-muted-foreground max-w-2xl leading-relaxed">{publicProfile.bio}</div>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  {publicProfile.working_on && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary border border-border rounded-lg text-[11px] font-tech text-foreground">
                      <Wrench className="h-3 w-3" /> {publicProfile.working_on}
                    </span>
                  )}
                  {publicProfile.looking_for && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary border border-border rounded-lg text-[11px] font-tech text-foreground">
                      <Search className="h-3 w-3" /> {publicProfile.looking_for}
                    </span>
                  )}
                  {/* Printer / filament setup — optional, never looks incomplete */}
                  {(publicProfile.printer_model || publicProfile.filament_type) && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {publicProfile.printer_model && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary border border-border rounded-lg text-[11px] font-tech text-muted-foreground">
                          {publicProfile.printer_model}
                        </span>
                      )}
                      {publicProfile.filament_type && (
                        <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary border border-border rounded-lg text-[11px] font-tech text-muted-foreground">
                          {publicProfile.filament_type}
                        </span>
                      )}
                    </div>
                  )}
                  {publicProfile.currently_printing && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 border border-accent/20 rounded-lg text-[11px] font-tech text-accent">
                      <Printer className="h-3 w-3" /> {publicProfile.currently_printing}
                      {publicProfile.currently_printing_percent != null && (
                        <span className="text-[10px] text-accent/80">({publicProfile.currently_printing_percent}%</span>
                      )}
                      {publicProfile.currently_printing_time_remaining && (
                        <span className="text-[10px] text-accent/80">· {publicProfile.currently_printing_time_remaining}</span>
                      )}
                      {publicProfile.currently_printing_percent != null && (
                        <span className="text-[10px] text-accent/80">)</span>
                      )}
                    </span>
                  )}
                </div>
                {(publicProfile.skills || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {publicProfile.skills.map((skill) => (
                      <span key={skill} className="px-2 py-1 bg-primary/10 border border-primary/20 text-primary rounded-lg text-[11px] font-tech">
                        {skill}
                      </span>
                    ))}
                  </div>
                )}
                {publicProfile.social_links && Object.keys(publicProfile.social_links).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {Object.entries(publicProfile.social_links).map(([platform, url]) => (
                      <a key={platform} href={url} target="_blank" rel="noreferrer" className="px-2 py-1 bg-secondary border border-border rounded-lg text-[11px] font-tech text-foreground hover:text-primary transition-colors">
                        {platform}
                      </a>
                    ))}
                  </div>
                )}
                {(publicProfile.awards || []).length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {publicProfile.awards.map((award) => (
                      <span key={award.badge_id || award.medal_id} className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 border border-accent/20 text-accent rounded-lg text-[11px] font-tech">
                        <Medal className="h-3 w-3" /> {award.label}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Instagram-style tabs */}
            <div className="flex border-b border-border mb-6 rise-in" data-testid="profile-tabs" style={{ animationDelay: "0.1s" }}>
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
                onClick={() => setProfileTab("collections")}
                data-testid="profile-tab-collections"
                className={`px-5 py-3 text-[11px] font-tech uppercase tracking-[0.2em] border-b-2 -mb-px transition-colors ${
                  profileTab === "collections" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                Collections
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
                  {publicListings.map((listing, i) => (
                    <Link
                      key={listing.listing_id}
                      to={`/listing/${listing.listing_id}`}
                      data-testid={`profile-listing-${listing.listing_id}`}
                      className="relative aspect-square bg-secondary overflow-hidden rounded-xl group block rise-in"
                      style={{ animationDelay: `${0.05 * (i % 8)}s` }}
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
            ) : profileTab === "collections" ? (
              (profileCollections || []).length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-16 font-tech uppercase tracking-wider">No public collections yet</div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1 sm:gap-2">
                  {profileCollections.map((col, i) => (
                    <Link
                      key={col.collection_id}
                      to={`/collections/${col.collection_id}`}
                      data-testid={`profile-collection-${col.collection_id}`}
                      className="relative aspect-square bg-secondary overflow-hidden rounded-xl group block flex items-center justify-center border border-border hover:border-primary/60 transition-colors rise-in"
                      style={{ animationDelay: `${0.05 * (i % 8)}s` }}
                      title={col.name}
                    >
                      <div className="text-center px-4">
                        <div className="font-display text-lg font-medium truncate">{col.name}</div>
                        <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground mt-1">{col.item_count || 0} items · {col.follower_count || 0} followers</div>
                      </div>
                    </Link>
                  ))}
                </div>
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
      const socialLinksObj = {};
      (socialLinks || "").split("\n").forEach((line) => {
        const [k, ...rest] = line.split(":");
        if (k && rest.length) socialLinksObj[k.trim()] = rest.join(":").trim();
      });
      const skillsArray = skills.split(",").map((s) => s.trim()).filter(Boolean);
      const r = await api.put("/profile", {
        name,
        user_tag: userTag || null,
        description: description || null,
        picture,
        account_type: accountType,
        working_on: workingOn || null,
        looking_for: lookingFor || null,
        currently_printing: currentlyPrinting || null,
        currently_printing_percent: currentlyPrintingPercent ? Number(currentlyPrintingPercent) : null,
        currently_printing_time_remaining: currentlyPrintingTimeRemaining || null,
        bio: bio || null,
        skills: skillsArray.length ? skillsArray : null,
        social_links: Object.keys(socialLinksObj).length ? socialLinksObj : null,
        printer_model: printerModel || null,
        filament_type: filamentType || null,
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
        <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3 rise-in">
          <span className="text-primary">●</span> Profile
        </div>
        <h1 className="font-display text-4xl font-medium tracking-tighter mb-10 rise-in rise-in-1">Edit your profile</h1>

        <div className="border border-border rounded-xl p-5 mb-8 bg-card auto-glow-pulse">
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

        <div className="flex items-center gap-6 mb-10 pb-10 border-b border-border rise-in rise-in-2">
          <Avatar className="h-24 w-24 border-2 border-border auto-float">
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
              <Sparkles className="h-3 w-3" /> Hyperspace member
            </div>
          )}
        </div>

        <div className="space-y-6 rise-in-4">
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
          <Field label="Bio">
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
          <Field label="Working On">
            <Input
              data-testid="profile-working-on-input"
              value={workingOn}
              onChange={(e) => setWorkingOn(e.target.value)}
              placeholder="🚀 Modular Rocket Lamp"
              maxLength={120}
              className="font-tech rounded-xl"
            />
          </Field>
          <Field label="Looking For">
            <Input
              data-testid="profile-looking-for-input"
              value={lookingFor}
              onChange={(e) => setLookingFor(e.target.value)}
              placeholder="Need beta testers"
              maxLength={120}
              className="font-tech rounded-xl"
            />
          </Field>
          <Field label="Currently Printing">
            <Input
              data-testid="profile-currently-printing-input"
              value={currentlyPrinting}
              onChange={(e) => setCurrentlyPrinting(e.target.value)}
              placeholder="Printing: Dragon Egg"
              maxLength={120}
              className="font-tech rounded-xl"
            />
          </Field>
          {currentlyPrinting && (
            <div className="grid grid-cols-2 gap-4">
              <Field label="Percent Complete">
                <Input
                  data-testid="profile-currently-printing-percent-input"
                  type="number"
                  min={0}
                  max={100}
                  value={currentlyPrintingPercent}
                  onChange={(e) => setCurrentlyPrintingPercent(e.target.value)}
                  placeholder="72"
                  className="font-tech rounded-xl"
                />
              </Field>
              <Field label="Time Remaining">
                <Input
                  data-testid="profile-currently-printing-time-remaining-input"
                  value={currentlyPrintingTimeRemaining}
                  onChange={(e) => setCurrentlyPrintingTimeRemaining(e.target.value)}
                  placeholder="2h 30m"
                  maxLength={60}
                  className="font-tech rounded-xl"
                />
              </Field>
            </div>
          )}
          <Field label="Bio">
            <Textarea
              data-testid="profile-bio-input"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell the community about your maker journey..."
              rows={4}
              className="font-tech text-sm rounded-xl"
            />
          </Field>
<Field label="Printer Model (optional)">
              <PrinterModelSelector
                value={printerModel}
                onChange={(id) => {
                  const model = PRINTER_MODELS.find((m) => m.id === id);
                  setPrinterModel(model ? model.name : "");
                }}
              />
            </Field>
            <Field label="Filament Type (optional)">
              <Input
                data-testid="profile-filament-type-input"
                value={filamentType}
                onChange={(e) => setFilamentType(e.target.value)}
                placeholder="e.g. Prusament PLA"
                maxLength={200}
                className="font-tech rounded-xl"
              />
            </Field>
          <Field label="Skills (comma separated)" className="rise-in">
            <Input
              data-testid="profile-skills-input"
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              placeholder="SLA, FDM, CAD, Blender,electronics"
              className="font-tech rounded-xl"
            />
          </Field>
          <Field label="Social Links (one per line: platform url)">
            <Textarea
              data-testid="profile-social-links-input"
              value={socialLinks}
              onChange={(e) => setSocialLinks(e.target.value)}
              placeholder="Twitter: https://twitter.com/yourhandle&#10;Instagram: https://instagram.com/yourhandle&#10;Website: https://yoursite.com"
              rows={4}
              className="font-tech text-sm rounded-xl"
            />
          </Field>
        </div>

        <div className="mt-10">
          <Button
            data-testid="profile-save-btn"
            onClick={save}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider auto-glow-pulse"
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
    earned.push({ id: "pro", label: "Hyperspace Member", icon: Sparkles, color: "text-accent", static: true });
  }
  (profile?.milestone_badges || []).forEach((id) => {
    const meta = MILESTONE_META[id];
    if (meta) earned.push({ id, label: meta.label, icon: meta.icon, color: meta.color, static: false, kind: meta.kind });
  });
  (profile?.marketplace_milestone_badges || []).forEach((id) => {
    const meta = MILESTONE_META[id];
    if (meta) earned.push({ id, label: meta.label, icon: meta.icon, color: meta.color, static: false, kind: meta.kind, category: "marketplace" });
  });

  if (!earned.length) {
    return <div className="text-sm text-muted-foreground text-center py-16 font-tech uppercase tracking-wider">No badges earned yet</div>;
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {earned.map((b, i) => {
          const Icon = b.icon;
          return (
            <button
              key={b.id}
              type="button"
              disabled={b.static}
              onClick={() => !b.static && setOpen3D(b.id)}
              data-testid={`profile-badge-${b.id}`}
              className={`flex flex-col items-center gap-2 rounded-2xl bg-card shadow-sm p-5 text-center auto-float ${!b.static ? "hover:shadow-lg transition-shadow cursor-pointer" : "cursor-default"}`}
              style={{ animationDelay: `${0.1 * (i % 8)}s` }}
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

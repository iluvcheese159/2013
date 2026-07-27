/* eslint-disable */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Send, ArrowLeft, Plus, Lock, Globe, SmilePlus, Reply, Forward } from "lucide-react";
import UserBadges from "@/components/UserBadges";

export default function Messages() {
  const { user, openAuth } = useAuth();
  const navigate = useNavigate();
  const { otherId } = useParams();
  const [tab, setTab] = useState("dms");

  const [threads, setThreads] = useState([]);
  const [results, setResults] = useState([]);
  const [q, setQ] = useState("");
  const [thread, setThread] = useState(null);

  const [clubs, setClubs] = useState([]);
  const [myClubs, setMyClubs] = useState([]);
  const [activeClub, setActiveClub] = useState(null);
  const [clubMessages, setClubMessages] = useState([]);
  const [joinModalClub, setJoinModalClub] = useState(null);
  const [clubCreateOpen, setClubCreateOpen] = useState(false);
  const [clubForm, setClubForm] = useState({
    club_name: "",
    club_privacy_level: "PUBLIC",
    is_charge_subscription_enabled: false,
    is_premium_chat: false,
    club_entry_monthly_price: 0,
  });

  const [body, setBody] = useState("");
  const [sending, setSending] = useState(false);
  const [contextMenu, setContextMenu] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    api.get("/messages/threads").then((r) => setThreads(r.data)).catch(() => {});
    api.get("/clubs").then((r) => setClubs(r.data || [])).catch(() => setClubs([]));
    api.get("/clubs/my").then((r) => setMyClubs(r.data || [])).catch(() => setMyClubs([]));
  }, [user]);

  useEffect(() => {
    if (!q || q.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      api.get(`/users/search?q=${encodeURIComponent(q)}`).then((r) => setResults(r.data)).catch(() => setResults([]));
    }, 200);
    return () => clearTimeout(t);
  }, [q]);

  useEffect(() => {
    if (!otherId || !user) {
      setThread(null);
      return;
    }
    api.get(`/messages/${otherId}`).then((r) => setThread(r.data)).catch(() => setThread(null));
  }, [otherId, user]);

  useEffect(() => {
    if (!user || tab !== "dms" || !otherId) return;
    const id = setInterval(() => {
      api.get(`/messages/${otherId}`).then((r) => setThread(r.data)).catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [user?.user_id, tab, otherId]);

  useEffect(() => {
    if (!user || tab !== "clubs" || !activeClub?.chat_id) return;
    const id = setInterval(() => {
      api.get(`/clubs/${activeClub.chat_id}/messages`).then((r) => setClubMessages(r.data || [])).catch(() => {});
    }, 3000);
    return () => clearInterval(id);
  }, [user?.user_id, tab, activeClub?.chat_id]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [thread, clubMessages]);

  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  if (!user) {
    return (
      <div className="pt-24 px-6 md:px-12 text-center">
        <h1 className="font-display text-3xl font-medium mb-4">Sign in to message makers</h1>
        <Button data-testid="messages-signin-btn" onClick={() => openAuth("signin")} className="bg-primary hover:bg-primary/90 rounded-xl font-tech text-xs uppercase tracking-wider">
          Sign in
        </Button>
      </div>
    );
  }

  const sendDm = async () => {
    if (!body.trim() || !otherId) return;
    setSending(true);
    try {
      const r = await api.post("/messages", { recipient_id: otherId, body });
      setThread((prev) => ({ ...(prev || {}), messages: [...(prev?.messages || []), r.data] }));
      setBody("");
      api.get("/messages/threads").then((res) => setThreads(res.data));
    } finally {
      setSending(false);
    }
  };

  const sendClubMessage = async () => {
    if (!activeClub || !body.trim()) return;
    setSending(true);
    try {
      const r = await api.post(`/clubs/${activeClub.chat_id}/messages`, { body });
      setClubMessages((prev) => [...prev, r.data]);
      setBody("");
    } finally {
      setSending(false);
    }
  };

  const joinClub = async (club, subscribeToPaid = false) => {
    try {
      await api.post(`/clubs/${club.chat_id}/join`, { subscribe_to_paid: subscribeToPaid });
      const [allClubs, mine] = await Promise.all([api.get("/clubs"), api.get("/clubs/my")]);
      setClubs(allClubs.data || []);
      setMyClubs(mine.data || []);
      setJoinModalClub(null);
      openClub(club);
    } catch (e) {
      if (e?.response?.status === 402) setJoinModalClub(club);
    }
  };

  const openClub = async (club) => {
    setActiveClub(club);
    setTab("clubs");
    try {
      const r = await api.get(`/clubs/${club.chat_id}/messages`);
      setClubMessages(r.data || []);
    } catch {
      setClubMessages([]);
    }
  };

  const createClub = async () => {
    try {
      const payload = {
        ...clubForm,
        club_entry_monthly_price: Number(clubForm.club_entry_monthly_price || 0),
      };
      const r = await api.post("/clubs", payload);
      setClubCreateOpen(false);
      setClubForm({ club_name: "", club_privacy_level: "PUBLIC", is_charge_subscription_enabled: false, is_premium_chat: false, club_entry_monthly_price: 0 });
      joinClub(r.data, true);
    } catch {}
  };

  const onBubbleContext = (e, message) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, message });
  };

  const activeMessages = useMemo(() => {
    if (tab === "clubs") return clubMessages;
    return thread?.messages || [];
  }, [tab, clubMessages, thread]);

  return (
    <div data-testid="messages-page" className="pt-14 h-screen flex">
      <aside className="w-80 border-r border-border bg-card overflow-y-auto flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => setTab("dms")} className={`px-2 py-1 text-[10px] font-tech uppercase tracking-wider border rounded-xl ${tab === "dms" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>Messages</button>
            <button onClick={() => setTab("clubs")} className={`px-2 py-1 text-[10px] font-tech uppercase tracking-wider border rounded-xl ${tab === "clubs" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>Discovery Clubs</button>
            <button onClick={() => setClubCreateOpen(true)} className="ml-auto h-7 w-7 border border-border rounded-xl inline-flex items-center justify-center hover:border-primary" title="Create Club">
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === "clubs" ? "Search club names..." : "Find a maker..."} className="pl-8 font-tech text-sm rounded-xl" />
          </div>
        </div>

        {tab === "dms" && (
          <>
            {results.length > 0 && (
              <div className="p-2 border-b border-border">
                <div className="text-[9px] font-tech uppercase tracking-[0.2em] text-muted-foreground px-2 py-1">Search results</div>
                {results.map((u) => (
                  <button key={u.user_id} onClick={() => navigate(`/messages/${u.user_id}`)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-secondary text-left">
                    <Avatar className="h-8 w-8"><AvatarImage src={u.picture} /><AvatarFallback>{u.name?.[0] || "U"}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate inline-flex items-center gap-1">{u.name} <UserBadges isPro={u.is_pro} isPlatformOwner={u.is_platform_owner} /></div>
                      {u.user_tag && <div className="text-[10px] font-tech text-muted-foreground truncate">@{u.user_tag}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex-1">
              {threads.map((t) => (
                <button key={t.user.user_id} onClick={() => navigate(`/messages/${t.user.user_id}`)} className={`w-full flex items-start gap-3 p-3 border-b border-border hover:bg-secondary text-left ${otherId === t.user.user_id ? "bg-secondary" : ""}`}>
                  <Avatar className="h-9 w-9"><AvatarImage src={t.user.picture} /><AvatarFallback>{t.user.name?.[0] || "U"}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-medium truncate inline-flex items-center gap-1">{t.user.name} <UserBadges isPro={t.user.is_pro} isPlatformOwner={t.user.is_platform_owner} /></span>
                      {t.unread > 0 && <span className="text-[9px] font-tech bg-primary text-primary-foreground rounded-full px-1.5 py-0.5">{t.unread}</span>}
                    </div>
                    <div className="text-xs text-muted-foreground truncate">{t.last_message}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {tab === "clubs" && (
          <div className="flex-1">
            <div className="px-3 py-2 text-[9px] font-tech uppercase tracking-wider text-muted-foreground">Your Clubs</div>
            {myClubs.map((c) => (
              <button key={`my-${c.chat_id}`} onClick={() => openClub(c)} className={`w-full px-3 py-2 border-b border-border text-left hover:bg-secondary ${activeClub?.chat_id === c.chat_id ? "bg-secondary" : ""}`}>
                <div className="text-sm font-medium truncate">{c.club_name}</div>
                <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
                  {c.club_privacy_level === "PRIVATE" ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />} {c.club_privacy_level}
                </div>
              </button>
            ))}
            <div className="px-3 py-2 text-[9px] font-tech uppercase tracking-wider text-muted-foreground">Discovery Clubs</div>
            {clubs.filter((c) => c.club_name.toLowerCase().includes(q.toLowerCase())).map((c) => (
              <div key={c.chat_id} className="px-3 py-2 border-b border-border">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium truncate">{c.club_name}</div>
                    <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground inline-flex items-center gap-1">
                      {c.club_privacy_level === "PRIVATE" ? <Lock className="h-3 w-3" /> : <Globe className="h-3 w-3" />} {c.club_privacy_level}
                    </div>
                    {c.is_charge_subscription_enabled ? <div className="text-[10px] text-[#F59E0B] font-tech">${Number(c.club_entry_monthly_price || 0).toFixed(2)} / month</div> : null}
                  </div>
                  {c.joined ? (
                    <Button size="sm" variant="outline" onClick={() => openClub(c)} className="h-7 rounded-xl font-tech text-[10px] uppercase tracking-wider">Open</Button>
                  ) : (
                    <Button size="sm" onClick={() => joinClub(c, false)} className="h-7 rounded-xl font-tech text-[10px] uppercase tracking-wider">Join</Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col">
        {!activeMessages.length && tab === "clubs" && !activeClub ? (
          <div className="flex-1 flex items-center justify-center text-sm font-tech text-muted-foreground">Pick a Discovery Club to start the stream</div>
        ) : !thread && tab === "dms" ? (
          <div className="flex-1 flex items-center justify-center text-sm font-tech text-muted-foreground">Pick a thread or search for a maker</div>
        ) : (
          <>
            <div className="flex items-center gap-3 p-4 shadow-sm" data-testid="conversation-header">
              <button onClick={() => navigate("/messages")} className="md:hidden text-muted-foreground"><ArrowLeft className="h-4 w-4" /></button>
              {tab === "dms" ? (
                <>
                  <Link to={`/profile/${thread?.other?.user_id}`}>
                    <Avatar className="h-11 w-11 border border-border hover:border-primary transition-colors"><AvatarImage src={thread?.other?.picture} /><AvatarFallback>{thread?.other?.name?.[0] || "U"}</AvatarFallback></Avatar>
                  </Link>
                  <div>
                    <div className="text-sm font-semibold inline-flex items-center gap-1.5 flex-wrap">
                      <Link to={`/profile/${thread?.other?.user_id}`} className="hover:underline">{thread?.other?.name}</Link>
                      <UserBadges isPro={thread?.other?.is_pro} isPlatformOwner={thread?.other?.is_platform_owner} milestoneBadges={thread?.other?.milestone_badges} />
                      {thread?.other?.user_tag && (
                        <span className="text-muted-foreground font-normal font-tech text-xs">· @{thread.other.user_tag}</span>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-9 w-9 rounded-xl border border-border bg-secondary flex items-center justify-center"><Globe className="h-4 w-4" /></div>
                  <div>
                    <div className="text-sm font-medium">{activeClub?.club_name}</div>
                    <div className="text-[10px] font-tech text-muted-foreground uppercase tracking-wider">Discovery Club</div>
                  </div>
                </>
              )}
            </div>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-3">
              {activeMessages.map((m) => {
                const mine = m.sender_id === user.user_id;
                return (
                  <div key={m.message_id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      onContextMenu={(e) => onBubbleContext(e, m)}
                      className={`max-w-md px-4 py-2 rounded-lg text-sm ${mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"}`}
                    >
                      {!mine && tab === "clubs" ? <div className="text-[10px] font-tech uppercase tracking-wider opacity-70 mb-1">{m.sender_name}</div> : null}
                      {m.body}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-border p-4 flex gap-2">
              <Input value={body} onChange={(e) => setBody(e.target.value)} onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), tab === "clubs" ? sendClubMessage() : sendDm())} placeholder={tab === "clubs" ? "Post to club stream..." : "Message — negotiate, ask, collab..."} className="font-tech text-sm rounded-xl" />
              <Button onClick={tab === "clubs" ? sendClubMessage : sendDm} disabled={sending || !body.trim()} className="bg-primary hover:bg-primary/90 rounded-xl"><Send className="h-4 w-4" /></Button>
            </div>
          </>
        )}
      </main>

      <Dialog open={clubCreateOpen} onOpenChange={setClubCreateOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Create Discovery Club</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={clubForm.club_name} onChange={(e) => setClubForm((p) => ({ ...p, club_name: e.target.value }))} placeholder="Club Name" />
            <div>
              <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground mb-1">Club Privacy Level</div>
              <div className="flex gap-2">
                <button onClick={() => setClubForm((p) => ({ ...p, club_privacy_level: "PUBLIC" }))} className={`px-3 py-1.5 border rounded-xl text-xs font-tech uppercase tracking-wider ${clubForm.club_privacy_level === "PUBLIC" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>PUBLIC</button>
                <button onClick={() => setClubForm((p) => ({ ...p, club_privacy_level: "PRIVATE", is_charge_subscription_enabled: false }))} className={`px-3 py-1.5 border rounded-xl text-xs font-tech uppercase tracking-wider ${clubForm.club_privacy_level === "PRIVATE" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>PRIVATE</button>
              </div>
            </div>
            {clubForm.club_privacy_level === "PUBLIC" ? (
              <label className="flex items-center gap-2 text-xs font-tech text-muted-foreground">
                <input type="checkbox" checked={clubForm.is_charge_subscription_enabled} onChange={(e) => setClubForm((p) => ({ ...p, is_charge_subscription_enabled: e.target.checked, is_premium_chat: e.target.checked }))} className="accent-primary" />
                Charge monthly subscription
              </label>
            ) : null}
            {clubForm.is_charge_subscription_enabled ? (
              <Input type="number" min="0" step="0.01" value={clubForm.club_entry_monthly_price} onChange={(e) => setClubForm((p) => ({ ...p, club_entry_monthly_price: e.target.value }))} placeholder="Monthly price" />
            ) : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setClubCreateOpen(false)} className="rounded-xl font-tech text-xs uppercase tracking-wider">Cancel</Button>
            <Button onClick={createClub} className="rounded-xl font-tech text-xs uppercase tracking-wider">Create Club</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!joinModalClub} onOpenChange={(v) => !v && setJoinModalClub(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Subscription Required</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">This Public Discovery Club requires a membership fee before joining.</p>
          <div className="rounded-xl p-3 text-sm bg-card shadow-sm">
            <div className="font-medium">{joinModalClub?.club_name}</div>
            <div className="text-[#F59E0B] font-tech">${Number(joinModalClub?.club_entry_monthly_price || 0).toFixed(2)} / month</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setJoinModalClub(null)} className="rounded-xl font-tech text-xs uppercase tracking-wider">Cancel</Button>
            <Button onClick={() => joinModalClub && joinClub(joinModalClub, true)} className="rounded-xl font-tech text-xs uppercase tracking-wider">Subscribe & Join</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {contextMenu ? (
        <div
          className="fixed z-[120] min-w-44 border border-border bg-card rounded-xl shadow-lg p-1"
          style={{ top: contextMenu.y, left: contextMenu.x }}
        >
          <button className="w-full text-left px-2 py-1.5 text-xs font-tech uppercase tracking-wider hover:bg-secondary inline-flex items-center gap-2"><Forward className="h-3 w-3" /> Forward</button>
          <button className="w-full text-left px-2 py-1.5 text-xs font-tech uppercase tracking-wider hover:bg-secondary inline-flex items-center gap-2"><Reply className="h-3 w-3" /> Reply</button>
          <button className="w-full text-left px-2 py-1.5 text-xs font-tech uppercase tracking-wider hover:bg-secondary inline-flex items-center gap-2"><SmilePlus className="h-3 w-3" /> Emoji React</button>
        </div>
      ) : null}
    </div>
  );
}

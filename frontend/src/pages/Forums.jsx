/* eslint-disable */
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import WireframeCube from "@/components/WireframeCube";
import { Plus, Rocket, Gauge, MessageCircle, Eye, Pin, Link2, ImageIcon, Send, ThumbsUp } from "lucide-react";

const SECTIONS = ["3D Printing Help", "Design Showcases", "General Chat", "Hardware Reviews"];

export default function Forums() {
  const { user, openAuth } = useAuth();
  const [section, setSection] = useState("General Chat");
  const [posts, setPosts] = useState([]);
  const [history, setHistory] = useState([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [detailPost, setDetailPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [createTab, setCreateTab] = useState("text");
  const [form, setForm] = useState({
    title: "",
    body_content: "",
    section_category: "General Chat",
    post_type: "text",
    image_url: "",
    link_url: "",
  });
  const [commentBody, setCommentBody] = useState("");
  const [replyTo, setReplyTo] = useState(null);

  const loadPosts = async () => {
    const r = await api.get(`/forums/posts?section_category=${encodeURIComponent(section)}&sort_mode=hot`);
    setPosts(r.data || []);
  };

  const loadHistory = async () => {
    if (!user) return setHistory([]);
    try {
      const r = await api.get("/forums/history/expanded");
      setHistory(r.data || []);
    } catch {
      setHistory([]);
    }
  };

  useEffect(() => {
    loadPosts().catch(() => setPosts([]));
  }, [section]);

  useEffect(() => {
    loadHistory();
  }, [user?.user_id]);

  // Auto-refresh posts every 30 seconds for automatic interactions
  useEffect(() => {
    const interval = setInterval(() => {
      loadPosts();
    }, 30000);
    return () => clearInterval(interval);
  }, [section]);

  const vote = async (postId, direction) => {
    if (!user) return openAuth("signin");
    try {
      const r = await api.post(`/forums/posts/${postId}/vote`, { direction });
      setPosts((prev) => prev.map((p) => (p.post_id === postId ? { ...p, ...r.data } : p)));
    } catch {}
  };

  const meToo = async (postId) => {
    if (!user) return openAuth("signin");
    try {
      const r = await api.post(`/forums/posts/${postId}/me-too`, {});
      setPosts((prev) => prev.map((p) => (p.post_id === postId ? { ...p, me_too_count: r.data.me_too_count, me_too_active: r.data.active } : p)));
    } catch {}
  };

  const openDetail = async (post) => {
    setDetailPost(post);
    try {
      const [postResp, commentsResp] = await Promise.all([
        api.get(`/forums/posts/${post.post_id}`),
        api.get(`/forums/posts/${post.post_id}/comments`),
      ]);
      setDetailPost(postResp.data);
      setComments(commentsResp.data || []);
      loadHistory();
    } catch {
      setComments([]);
    }
  };

  const createPost = async () => {
    if (!user) return openAuth("signin");
    try {
      const payload = {
        ...form,
        post_type: createTab,
      };
      await api.post("/forums/posts", payload);
      setCreateOpen(false);
      setForm({ title: "", body_content: "", section_category: section, post_type: "text", image_url: "", link_url: "" });
      loadPosts();
    } catch {}
  };

  const submitComment = async () => {
    if (!user || !detailPost || !commentBody.trim()) return;
    try {
      const r = await api.post(`/forums/posts/${detailPost.post_id}/comments`, {
        body: commentBody,
        parent_comment_id: replyTo,
      });
      setComments((prev) => [...prev, r.data]);
      setCommentBody("");
      setReplyTo(null);
    } catch {}
  };

  const voteComment = async (commentId, direction) => {
    if (!user) return openAuth("signin");
    try {
      const r = await api.post(`/forums/comments/${commentId}/vote`, { direction });
      setComments((prev) => prev.map((c) => (c.comment_id === commentId ? { ...c, ...r.data } : c)));
    } catch {}
  };

  const tree = useMemo(() => buildTree(comments), [comments]);

  return (
    <div data-testid="forums-page" className="pt-14 min-h-screen">
      <div className="border-b border-border px-6 md:px-12 lg:px-24 py-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3"><span className="text-primary">●</span> Mission Control</div>
            <h1 className="font-display text-4xl sm:text-5xl font-light tracking-tighter">NASA Mission Control.</h1>
          </div>
          <Button onClick={() => setCreateOpen(true)} className="rounded-xl font-tech text-xs uppercase tracking-wider">
            <Plus className="h-3.5 w-3.5 mr-1" /> Create Thread
          </Button>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <button
              key={s}
              onClick={() => setSection(s)}
              className={`px-3 py-1.5 text-[10px] font-tech uppercase tracking-wider border rounded-xl ${section === s ? "border-primary text-primary" : "border-border text-muted-foreground"}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-8 grid grid-cols-1 gap-3">
        {posts.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl px-6 py-10 text-center flex flex-col items-center">
            <div className="mb-6 opacity-90">
              <WireframeCube size={88} />
            </div>
            <p className="max-w-xl text-sm text-muted-foreground leading-relaxed">
              No forum posts found in this section yet. Be the first to start a thread.
            </p>
          </div>
        ) : posts.map((post) => (
          <button
            key={post.post_id}
            onClick={() => openDetail(post)}
            className={`text-left border rounded-xl bg-card overflow-hidden hover:border-primary transition-colors mission-control-glow ${post.is_pinned_by_admin ? "border-[#00FFC8]/60" : "border-border/40"}`}
          >
            <div className="flex">
              <div className="w-14 border-r border-border p-2 flex flex-col items-center gap-2">
                <button onClick={(e) => { e.stopPropagation(); vote(post.post_id, "up"); }} className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-secondary text-[#F59E0B]">
                  <Rocket className="h-4 w-4" />
                </button>
                <div className="text-xs font-tech">{post.score_count ?? ((post.upvotes_count || 0) - (post.downvotes_count || 0))}</div>
                <button onClick={(e) => { e.stopPropagation(); vote(post.post_id, "down"); }} className="h-8 w-8 rounded-xl flex items-center justify-center hover:bg-secondary text-slate-400">
                  <Gauge className="h-4 w-4" />
                </button>
              </div>
              <div className="flex-1 p-4">
                <div className="flex items-center gap-2 text-[10px] font-tech uppercase tracking-wider text-muted-foreground mb-1">
                  {post.is_pinned_by_admin ? <><Pin className="h-3 w-3 text-[#F59E0B]" /> Pinned</> : null}
                  <span>{post.section_category}</span>
                </div>
                <div className="font-display text-xl font-medium mb-1">{post.title}</div>
                <div className="text-sm text-muted-foreground line-clamp-2">{post.body_content}</div>
                {post.post_type === "image" && post.image_url ? <img src={post.image_url} alt="" className="mt-3 h-36 w-full object-cover rounded-xl border border-border" /> : null}
                {post.post_type === "link" && post.link_url ? <div className="mt-2 text-xs text-primary inline-flex items-center gap-1"><Link2 className="h-3 w-3" /> {post.link_url}</div> : null}
                <div className="mt-3 flex items-center gap-4 text-[10px] font-tech uppercase tracking-wider text-muted-foreground">
                  <span className="inline-flex items-center gap-1"><MessageCircle className="h-3 w-3" /> Comments</span>
                  <span className="inline-flex items-center gap-1"><Eye className="h-3 w-3" /> {post.views_count || 0}</span>
                  <button onClick={(e) => { e.stopPropagation(); meToo(post.post_id); }} className={`inline-flex items-center gap-1 ${post.me_too_active ? "text-accent" : "hover:text-foreground"}`}>
                    <ThumbsUp className="h-3 w-3" /> {post.me_too_count || 0}
                  </button>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      <div className="px-6 md:px-12 lg:px-24 pb-20">
        <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground mb-2">Most Recently Viewed Forums</div>
        <div className="flex gap-3 overflow-x-auto pb-2">
          {history.map((h) => (
            <button key={`${h.post?.post_id}-${h.viewed_at}`} onClick={() => h.post && openDetail(h.post)} className="shrink-0 w-72 border border-border rounded-xl p-3 text-left hover:border-primary">
              <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground mb-1">{h.post?.section_category}</div>
              <div className="font-medium truncate">{h.post?.title}</div>
            </button>
          ))}
        </div>
      </div>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">Create Mission Control Thread</DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-3">
            <button onClick={() => setCreateTab("text")} className={`px-3 py-1.5 rounded-xl text-xs font-tech uppercase tracking-wider border ${createTab === "text" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>Text Post</button>
            <button onClick={() => setCreateTab("image")} className={`px-3 py-1.5 rounded-xl text-xs font-tech uppercase tracking-wider border ${createTab === "image" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>Image Upload</button>
            <button onClick={() => setCreateTab("link")} className={`px-3 py-1.5 rounded-xl text-xs font-tech uppercase tracking-wider border ${createTab === "link" ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>Link Post</button>
          </div>
          <div className="space-y-3">
            <Input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Thread title" className="border-cyan-500/30 focus:border-cyan-400" />
            <select value={form.section_category} onChange={(e) => setForm((p) => ({ ...p, section_category: e.target.value }))} className="w-full h-10 rounded-xl border border-cyan-500/30 bg-background px-3 text-sm focus:border-cyan-400">
              {SECTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
            <Textarea rows={6} value={form.body_content} onChange={(e) => setForm((p) => ({ ...p, body_content: e.target.value }))} placeholder="Post body" />
            {createTab === "image" ? <Input value={form.image_url} onChange={(e) => setForm((p) => ({ ...p, image_url: e.target.value }))} placeholder="Image URL" /> : null}
            {createTab === "link" ? <Input value={form.link_url} onChange={(e) => setForm((p) => ({ ...p, link_url: e.target.value }))} placeholder="Link URL" /> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="rounded-xl font-tech text-xs uppercase tracking-wider">Cancel</Button>
            <Button onClick={createPost} className="rounded-xl font-tech text-xs uppercase tracking-wider">Publish</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!detailPost} onOpenChange={(v) => !v && setDetailPost(null)}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto mission-control-glow">
          {detailPost && (
            <div>
              <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground mb-1">{detailPost.section_category}</div>
              <h2 className="font-display text-3xl font-medium mb-2">{detailPost.title}</h2>
              <p className="text-sm text-muted-foreground whitespace-pre-line mb-4">{detailPost.body_content}</p>
              <div className="border-t border-border pt-4">
                <div className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground mb-2">Comments</div>
                <div className="space-y-2 mb-3">
                  {tree.map((node) => (
                    <CommentNode key={node.comment_id} node={node} depth={0} onVote={voteComment} onReply={setReplyTo} />
                  ))}
                </div>
                <div className="flex gap-2 items-start">
                  <MentionTextarea
                    value={commentBody}
                    onChange={setCommentBody}
                    placeholder={replyTo ? "Reply to comment... (type @ to mention)" : "Add a comment... (type @ to mention)"}
                  />
                  <Button onClick={submitComment} className="rounded-xl"><Send className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── MentionTextarea ──────────────────────────────────────────────────────────
// A textarea that shows a user-tag autocomplete dropdown when the user types @.
function MentionTextarea({ value, onChange, placeholder, rows = 3 }) {
  const [suggestions, setSuggestions] = useState([]);
  const [mentionQuery, setMentionQuery] = useState(null);
  const [mentionStart, setMentionStart] = useState(0);
  const textareaRef = useRef(null);
  const debounceRef = useRef(null);

  const handleChange = (e) => {
    const val = e.target.value;
    onChange(val);
    const cursor = e.target.selectionStart;
    const before = val.slice(0, cursor);
    const match = before.match(/@([A-Za-z0-9_]*)$/);
    if (match) {
      const query = match[1];
      setMentionQuery(query);
      setMentionStart(cursor - query.length - 1);
      clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(async () => {
        if (query.length === 0) { setSuggestions([]); return; }
        try {
          const r = await api.get(`/users/search-tag?q=${encodeURIComponent(query)}&limit=6`);
          setSuggestions(r.data || []);
        } catch { setSuggestions([]); }
      }, 200);
    } else {
      setMentionQuery(null);
      setSuggestions([]);
    }
  };

  const pickSuggestion = (tag) => {
    const before = value.slice(0, mentionStart);
    const after = value.slice(textareaRef.current?.selectionStart || mentionStart + (mentionQuery?.length || 0) + 1);
    onChange(`${before}@${tag} ${after}`);
    setSuggestions([]);
    setMentionQuery(null);
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  return (
    <div className="relative flex-1">
      <Textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        rows={rows}
        placeholder={placeholder}
        className="font-tech text-sm rounded-xl"
      />
      {suggestions.length > 0 && mentionQuery !== null && (
        <div className="absolute bottom-full left-0 mb-1 w-56 bg-card border border-border rounded-xl shadow-lg overflow-hidden z-50">
          {suggestions.map((u) => (
            <button
              key={u.user_id}
              type="button"
              onMouseDown={(e) => { e.preventDefault(); pickSuggestion(u.user_tag); }}
              className="w-full text-left px-3 py-2 text-xs font-tech hover:bg-secondary flex items-center gap-2"
            >
              <span className="text-muted-foreground">@</span>
              <span className="text-foreground">{u.user_tag}</span>
              <span className="text-muted-foreground truncate ml-auto">{u.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function buildTree(comments) {
  const map = new Map();
  comments.forEach((c) => map.set(c.comment_id, { ...c, children: [] }));
  const roots = [];
  map.forEach((node) => {
    if (node.parent_comment_id && map.has(node.parent_comment_id)) {
      map.get(node.parent_comment_id).children.push(node);
    } else {
      roots.push(node);
    }
  });
  return roots;
}

function CommentNode({ node, depth, onVote, onReply }) {
  return (
    <div className="rounded-xl p-3 bg-card shadow-sm" style={{ marginLeft: `${Math.min(depth * 20, 120)}px` }}>
      <div className="text-xs font-tech text-muted-foreground mb-1">{node.author_name}</div>
      <div className="text-sm mb-2 whitespace-pre-line">{node.body}</div>
      <div className="flex items-center gap-2 text-[10px] font-tech uppercase tracking-wider text-muted-foreground">
        <button onClick={() => onVote(node.comment_id, "up")} className="inline-flex items-center gap-1 hover:text-[#F59E0B]"><Rocket className="h-3 w-3" /> {node.upvotes_count || 0}</button>
        <button onClick={() => onVote(node.comment_id, "down")} className="inline-flex items-center gap-1 hover:text-slate-400"><Gauge className="h-3 w-3" /> {node.downvotes_count || 0}</button>
        <button onClick={() => onReply(node.comment_id)} className="hover:text-primary">Reply</button>
      </div>
      {node.children?.length ? (
        <div className="mt-2 space-y-2">
          {node.children.map((child) => (
            <CommentNode key={child.comment_id} node={child} depth={depth + 1} onVote={onVote} onReply={onReply} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

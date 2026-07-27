import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, fileUrl } from "@/lib/api";
import { Box, Share2, GitFork, Search, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import SafeImage from "@/components/SafeImage";
import ModelViewer from "@/components/ModelViewer";

export default function Designs() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    api.get("/designs").then((r) => setItems(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const filtered = q
    ? items.filter((d) =>
        (d.title || "").toLowerCase().includes(q.toLowerCase()) ||
        (d.creator_name || "").toLowerCase().includes(q.toLowerCase())
      )
    : items;

  return (
    <div data-testid="designs-page" className="pt-14 min-h-screen">
      <div className="border-b border-border px-6 md:px-12 lg:px-24 py-10">
        <div className="text-xs font-tech uppercase tracking-[0.3em] text-muted-foreground mb-3">
          <span className="text-primary">●</span> Community
        </div>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-4xl sm:text-5xl font-light tracking-tighter">Open designs.</h1>
            <p className="text-sm text-muted-foreground mt-3 max-w-xl">
              Remix, print, or collab. Every design here was shared by a maker.
            </p>
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              data-testid="designs-search-input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search designs…"
              className="pl-9 rounded-xl font-tech text-sm"
            />
          </div>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-10">
        {loading ? (
          <div className="text-sm font-tech text-muted-foreground animate-pulse">Loading…</div>
        ) : filtered.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl py-20 text-center">
            <Box className="h-10 w-10 mx-auto mb-4 text-muted-foreground" strokeWidth={1.5} />
            <h3 className="font-display text-2xl font-light mb-2">{q ? "No matches" : "No open designs yet"}</h3>
            <p className="text-sm text-muted-foreground">
              {q ? "Try a different search term." : "Be the first to share — open the designer and save a creation."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((d) => (
              <Link
                key={d.design_id}
                to={`/designs/${d.design_id}`}
                data-testid={`design-card-${d.design_id}`}
                className="group border border-border rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all bg-card"
              >
                <div className="aspect-square bg-secondary border-b border-border overflow-hidden relative">
                  {d.image_paths?.[0] ? (
                    <SafeImage
                      src={fileUrl(d.image_paths[0])}
                      alt={d.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : d.model_path ? (
                    <ModelViewer modelPath={d.model_path} />
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <Box className="h-12 w-12 text-muted-foreground" strokeWidth={1} />
                    </div>
                  )}
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-full text-[9px] font-tech uppercase tracking-wider text-primary border border-primary/20">
                    <Share2 className="h-2.5 w-2.5" /> Open
                  </div>
                  {d.fork_count > 0 && (
                    <div className="absolute bottom-2 right-2 flex items-center gap-1 px-2 py-1 bg-background/80 backdrop-blur-sm rounded-full text-[9px] font-tech">
                      <GitFork className="h-2.5 w-2.5" /> {d.fork_count}
                    </div>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-display text-lg font-medium leading-tight mb-1 group-hover:text-primary transition-colors line-clamp-2">{d.title}</h3>
                  <div className="flex items-center justify-between">
                    <div className="text-[10px] font-tech uppercase tracking-[0.2em] text-muted-foreground">by {d.creator_name}</div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                  {d.description && (
                    <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{d.description}</p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, fileUrl } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui";
import { MembersTable } from "@/components/MembersTable";
import ClipboardList from "lucide-react";
import { Toast } from "@/components/Toast";

export default function BoardDetail() {
  const { id } = useParams();
  const { user, openAuth } = useAuth();
  const [board, setBoard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [newItemTitle, setNewItemTitle] = useState("");
  const [editingItem, setEditingItem] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`/boards/${id}`).then(r => setBoard(r.data)).catch(() => setBoard(null)),
      api.get(`/boards/${id}/members`).then(r => setMembers(r.data || [])).catch(() => setMembers([])),
      api.get(`/boards/${id}/checklist`).then(r => setChecklist(r.data || [])).catch(() => setChecklist([])),
    ]).finally(() => setLoading(false));
  }, [id]);

  const saveBoard = async () => {
    if (!user) return openAuth("signin");
    const payload = {
      title: board.title,
      description: board.description,
      is_public: board.is_public
    };
    await api.put(`/boards/${id}`, payload);
    toast.success("Board updated");
  }

  const addItem = async () => {
    if (!newItemTitle.trim()) return;
    const item = { title: newItemTitle, description: "", completed: false, order: checklist.length };
    setChecklist([...checklist, item]);
    setNewItemTitle("");
  }

  const updateItem = async (itemId) => {
    setEditingItem(itemId);
  }

  const saveItem = async (itemId) => {
    if (!newItemTitle.trim()) return;
    await api.put(`/boards/${id}/checklist/${itemId}`, { title: newItemTitle });
    setEditingItem(null);
    setNewItemTitle("");
    // Refresh outline
    const temp = await api.get(`/boards/${id}/checklist`);
    setChecklist(temp.data || []);
    toast.success("Item updated");
  }

  const deleteItem = async (itemId) => {
    await api.delete(`/boards/${id}/checklist/${itemId}`);
    // Refresh outline
    const temp = await api.get(`/boards/${id}/checklist`);
    setChecklist(temp.data || []);
    toast.success("Item deleted");
  }

  const deleteBoard = async () => {
    if (!window.confirm("Delete this board and all its data?")) return;
    await api.delete(`/boards/${id}`);
    navigate("/boards");
    toast.success("Board deleted");
  }

  if (loading) return <div className="pt-24 px-6 md:px-12 text-sm text-muted-foreground">Loading board…</div>;
  if (!board) return <div className="pt-24 px-6 md:px-12 text-sm text-muted-foreground">Board not found.</div>;

  return (
    <div data-testid="board-detail" className="pt-14 min-h-screen px-6 md:px-12 lg:px-24 py-10">
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="font-display text-3xl font-light">Board: {board.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {board.is_public && (
            <Button variant="outline" onClick={() => togglePublic(!board.is_public)} className="rounded-xl font-tech text-xs uppercase tracking-wider">
              {board.is_public ? "Hide" : "Set Private"}
            </Button>
          )}
          <Button variant="ghost" onClick={() => window.history.back()} className="rounded-xl font-tech text-xs uppercase tracking-wider">
            <ClipboardList className="h-4 w-4 mr-1" /> Back
          </Button>
        </div>
      </div>

      <div className="px-6 md:px-12 lg:px-24 py-10">
        <div className="mb-6">
          <div className="text-[10px] font-tech uppercase tracking-[0.3em] text-muted-foreground mb-2">
            <span className="text-primary">●</span> Collaboration Details
          </div>
          <p className="text-sm text-muted-foreground mb-3">{board.description || "No description available."}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <MemberList members={members} onRemove={removeMember} />
            </div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-secondary border border-border rounded-full text-[10px] font-tech uppercase tracking-wider">
                {board.member_count} members
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <div className="text-xs font-tech uppercase tracking-wider mb-1">Checklist</div>
          <div className="space-y-3 bg-background rounded-xl p-4 shadow-sm">
            {checklist.length === 0 ? (
              <div className="text-sm text-muted-foreground font-tech">No items yet.</div>
            ) : (
              <div className="flex flex-col items-end overflow-hidden">
                {checklist.map((item) => {
                  const isEditing = editingItem === item.uuid;
                  return (
                    <div key={item.uuid} className="flex items-center gap-3 p-2 rounded-xl border border-border hover:border-primary/50 bg-background transition-colors">
                      <div className="flex flex-col flex-grow-1">
                        <p className="truncate text-sm font-medium">{item.title}</p>
                        {item.description && <p className="text-[10px] text-muted-foreground break-words">{item.description}</p>}
                        {isEditing && (
                          <div className="mt-1 flex items-center gap-1">
                            <Input
                              value={newItemTitle}
                              onChange={(e) => setNewItemTitle(e.target.value)}
                              placeholder="New title"
                              className="border border-border rounded-xl px-2 py-1 text-sm font-tech w-full"
                              size="3"
                            />
                            <Button onClick={saveItem} disabled={!newItemTitle} className="rounded-xl bg-primary hover:bg-primary/90 font-tech text-xs uppercase tracking-wider px-3 py-1">
                              Save
                            </Button>
                            <Button variant="outline" onClick={() => setEditingItem(null)} className="rounded-xl font-tech text-xs uppercase tracking-wider px-3 py-1">Cancel</Button>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Check
                          className={item.complete ? "text-emerald-500" : "text-muted-foreground"}
                          onClick={() => toggleComplete(item.uuid)}
                        />
                        {item.complete ? (
                          <Trash2 className="h-3 w-3 text-red-500" />
                        ) : (
                          <CheckDouble className="h-3 w-3 text-green-500" />
                        )}
                      </div>
                      <span className="text-[10px] font-tech uppercase tracking-wider text-muted-foreground">
                        {item.order ? item.order + 1 + " • " : ""}{item.title}
                      </span>
                      {newItemInputVisible && (
                        <Input
                          value={newItemTitle}
                          onChange={(e) => setNewItemTitle(e.target.value)}
                          placeholder="Add item"
                          className="border border-transparent text-sm px-1 py-1 rounded"
                          size="2"
                        />
                      )}
                      </div>
                    </div>
                  });
                })
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {user && board.owner_id !== user.user_id && (
            <Button onClick={() => deleteBoard} variant="outline" className="rounded-xl font-tech text-xs uppercase tracking-wider">
              <Trash2 className="h-3 w-3 mr-1" /> Delete
            </Button>
          )}
          <Button onClick={() => navigate("/boards")} className="rounded-xl font-tech text-xs uppercase tracking-wider">
            Browse Boards
          </Button>
        </div>
      </div>
    </div>
  );
}
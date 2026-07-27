import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Scale, User, ShieldCheck, AlertTriangle, Tag, FolderOpen, Rocket, LayoutGrid, Calculator, MessageSquare, Lightbulb, BookOpen } from "lucide-react";

const ICONS = {
  Scale, User, ShieldCheck, AlertTriangle, Tag, FolderOpen, Rocket,
  LayoutGrid, Calculator, MessageSquare, Lightbulb, BookOpen
};

export default function PolicyEditor() {
  const { policyType } = useParams();
  const navigate = useNavigate();
  const [policy, setPolicy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [newRule, setNewRule] = useState({
    title: '',
    content: '',
    icon: 'Scale',
    order: 0
  });

  useEffect(() => {
    loadPolicy();
  }, [policyType]);

  const loadPolicy = async () => {
    try {
      const res = await api.get(`/api/owner/policies/${policyType}`);
      setPolicy(res.data);
    } catch (error) {
      toast.error('Failed to load policy');
    } finally {
      setLoading(false);
    }
  };

  const handleAddRule = async () => {
    if (!newRule.title.trim() || !newRule.content.trim()) {
      toast.error('Title and content are required');
      return;
    }

    try {
      const res = await api.post(`/api/owner/policies/${policyType}/rules`, {
        ...newRule,
        rule_id: `rule_${Date.now()}`,
        order: policy?.rules?.length || 0
      });
      toast.success('Rule added');
      setNewRule({ title: '', content: '', icon: 'Scale', order: 0 });
      await loadPolicy();
    } catch (error) {
      toast.error('Failed to add rule');
    }
  };

  const handleUpdateRule = async (ruleId, updates) => {
    try {
      await api.put(`/api/owner/policies/${policyType}/rules/${ruleId}`, {
        ...updates,
        rule_id: ruleId
      });
      toast.success('Rule updated');
      setEditingRuleId(null);
      await loadPolicy();
    } catch (error) {
      toast.error('Failed to update rule');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      await api.delete(`/api/owner/policies/${policyType}/rules/${ruleId}`);
      toast.success('Rule deleted');
      await loadPolicy();
    } catch (error) {
      toast.error('Failed to delete rule');
    }
  };

  const handleSavePolicy = async () => {
    try {
      await api.put(`/api/owner/policies/${policyType}`, policy);
      toast.success('Policy saved');
      navigate(-1); // Go back
    } catch (error) {
      toast.error('Failed to save policy');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!policy) {
    return <div className="text-center py-12">Policy not found</div>;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <h1 className="text-2xl font-bold">{policy.title}</h1>
          <Button variant="outline" onClick={() => navigate(-1)}>
            Back
          </Button>
        </div>

        <div className="space-y-6">
          {/* Policy Metadata */}
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-4">Policy Information</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Title</label>
                <Input
                  value={policy.title || ''}
                  onChange={(e) => setPolicy(p => ({...p, title: e.target.value}))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Version</label>
                <Input
                  value={policy.version || ''}
                  onChange={(e) => setPolicy(p => ({...p, version: e.target.value}))}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Last Updated</label>
                <Input
                  value={policy.last_updated || ''}
                  onChange={(e) => setPolicy(p => ({...p, last_updated: e.target.value}))}
                />
              </div>
            </div>
          </div>

          {/* Rules Editor */}
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-4">Rules</h2>
            
            {/* Add New Rule Form */}
            <div className="border rounded-lg p-4 mb-6">
              <h3 className="font-semibold mb-3">Add New Rule</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Title</label>
                  <Input
                    value={newRule.title}
                    onChange={(e) => setNewRule(nr => ({...nr, title: e.target.value}))}
                    placeholder="Enter rule title"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Content</label>
                  <Textarea
                    value={newRule.content}
                    onChange={(e) => setNewRule(nr => ({...nr, content: e.target.value}))}
                    rows={4}
                    placeholder="Enter rule content"
                  />
                </div>
                <div className="flex flex-wrap gap-3">
                  <label className="text-sm font-medium">Icon</label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(icons).map(([name, Icon]) => (
                      <button
                        key={name}
                        onClick={() => setNewRule(nr => ({...nr, icon: name}))}
                        className={`p-2 rounded border ${newRule.icon === name ? 'border-primary' : 'border-transparent'} hover:border-transparent`}
                        title={name}
                      >
                        <Icon className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button 
                    variant="secondary" 
                    onClick={handleAddRule}
                    disabled={!(newRule.title.trim() && newRule.content.trim())}
                  >
                    Add Rule
                  </Button>
                </div>
              </div>
            </div>

            {/* Existing Rules List */}
            <div className="space-y-4">
              {policy.rules?.map((rule, index) => (
                <div key={rule.rule_id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                  {editingRuleId === rule.rule_id ? (
                    // Edit mode
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium mb-1">Title</label>
                        <Input
                          value={rule.title}
                          onChange={(e) => handleUpdateRule(rule.rule_id, {...rule, title: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1">Content</label>
                        <Textarea
                          value={rule.content}
                          onChange={(e) => handleUpdateRule(rule.rule_id, {...rule, content: e.target.value})}
                          rows={4}
                        />
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <label className="text-sm font-medium">Icon</label>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(icons).map(([name, Icon]) => (
                            <button
                              key={name}
                              onClick={() => handleUpdateRule(rule.rule_id, {...rule, icon: name})}
                              className={`p-2 rounded border ${rule.icon === name ? 'border-primary' : 'border-transparent'} hover:border-transparent`}
                              title={name}
                            >
                              <Icon className="h-4 w-4" />
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setEditingRuleId(null)}>
                          Cancel
                        </Button>
                        <Button onClick={() => handleUpdateRule(rule.rule_id, rule)}>
                          Save
                        </Button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="h-8 w-8 flex items-center justify-center bg-primary/10 rounded-full">
                            <icons[rule.icon as keyof typeof icons] className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{rule.title}</h3>
                            <p className="text-sm text-muted-foreground">Order: {rule.order}</p>
                          </div>
                        </div>
                        <p className="text-sm text-foreground/90 leading-relaxed">{rule.content}</p>
                      </div>
                      <div className="flex items-end space-x-2">
                        <Button 
                          variant="secondary" 
                          size="sm" 
                          onClick={() => setEditingRuleId(rule.rule_id)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="destructive" 
                          size="sm" 
                          onClick={() => handleDeleteRule(rule.rule_id)}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )) || <p className="text-center text-muted-foreground py-4">No rules found</p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <Button 
            variant="secondary" 
            onClick={handleSavePolicy}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
</parameter= -1;)
}
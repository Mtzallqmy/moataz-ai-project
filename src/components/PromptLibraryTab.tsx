import React, { useState, useEffect } from "react";
import {
  Sparkles,
  Plus,
  Edit3,
  Trash2,
  Search,
  Star,
  Copy,
  Download,
  Upload,
  Check,
  Tag,
  Code,
  Layers,
  ChevronDown,
  Info,
  RefreshCw
} from "lucide-react";

interface PromptTemplate {
  id: string;
  name: string;
  content: string;
  description: string;
  category: string;
  isPublic: boolean;
  variables: string[];
  version: string;
  isFavorite: boolean;
  createdAt: string;
}

interface PromptLibraryTabProps {
  token: string;
}

export default function PromptLibraryTab({ token }: PromptLibraryTabProps) {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Edit or Create Modal
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<PromptTemplate | null>(null);

  // Form States
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [version, setVersion] = useState("1.0.0");
  const [isPublic, setIsPublic] = useState(false);

  // Import Panel States
  const [showImport, setShowImport] = useState(false);
  const [importJson, setImportJson] = useState("");

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/templates", {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setTemplates(data);
      }
    } catch (e) {
      console.error("Templates load error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setName("");
    setContent("");
    setDescription("");
    setCategory("general");
    setVersion("1.0.0");
    setIsPublic(false);
    setShowForm(true);
  };

  const handleOpenEdit = (t: PromptTemplate) => {
    setEditingTemplate(t);
    setName(t.name);
    setContent(t.content);
    setDescription(t.description);
    setCategory(t.category);
    setVersion(t.version);
    setIsPublic(t.isPublic);
    setShowForm(true);
  };

  const extractVariables = (txt: string): string[] => {
    const matches = txt.match(/\{\{([^}]+)\}\}/g);
    if (!matches) return [];
    return Array.from(new Set(matches.map(m => m.replace(/\{\{|\}\}/g, "").trim())));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    const variables = extractVariables(content);

    const payload = {
      name,
      content,
      description,
      category,
      version,
      isPublic,
      variables
    };

    try {
      if (editingTemplate) {
        // Edit Mode
        const res = await fetch(`/api/templates/${editingTemplate.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showFeedback("success", "Template updated successfully.");
          fetchTemplates();
          setShowForm(false);
        } else {
          showFeedback("error", "Failed to update template.");
        }
      } else {
        // Create Mode
        const res = await fetch("/api/templates", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          showFeedback("success", "Template created and added to Prompt Library.");
          fetchTemplates();
          setShowForm(false);
        } else {
          showFeedback("error", "Failed to create template.");
        }
      }
    } catch {
      showFeedback("error", "Server communication failure.");
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this prompt template?")) return;

    try {
      const res = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTemplates(templates.filter(t => t.id !== id));
        showFeedback("success", "Template deleted successfully.");
      }
    } catch {
      showFeedback("error", "Failed to delete template.");
    }
  };

  const toggleFavorite = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/templates/${id}/favorite`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setTemplates(
          templates.map(t => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t))
        );
      }
    } catch {}
  };

  const copyToClipboard = (txt: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(txt);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importJson.trim()) return;

    try {
      let parsed;
      try {
        parsed = JSON.parse(importJson);
      } catch {
        showFeedback("error", "Invalid JSON format. Check syntax.");
        return;
      }

      const templatesList = Array.isArray(parsed) ? parsed : [parsed];

      const res = await fetch("/api/templates/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ templates: templatesList })
      });

      if (res.ok) {
        showFeedback("success", "Prompt templates imported successfully.");
        fetchTemplates();
        setImportJson("");
        setShowImport(false);
      } else {
        showFeedback("error", "Invalid imports scheme.");
      }
    } catch {
      showFeedback("error", "Failed to connect with system importer.");
    }
  };

  const triggerExport = () => {
    // Navigate or direct download using browser
    window.open(`/api/templates/export?token=${token}`, "_blank");
    showFeedback("success", "Prompt Library exported as prompt_templates_export.json");
  };

  // Get list of unique categories for filters
  const categories = ["all", ...Array.from(new Set(templates.map(t => t.category)))];

  // Filtering Logic
  const filteredTemplates = templates.filter(t => {
    const matchesCategory = selectedCategory === "all" || t.category === selectedCategory;
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div id="prompt-library-tab" className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">Prompt Template Library</h2>
          <p className="text-slate-400 text-sm mt-1">
            Build, optimize, and reuse complex prompt templates parameterized with dynamic placeholder variables
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowImport(!showImport)}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Import Templates"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import</span>
          </button>
          <button
            onClick={triggerExport}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 p-2.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all"
            title="Export Templates"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            id="prompt-btn-add-template"
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Template</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          id="prompt-feedback"
          className={`p-3 bg-emerald-950/40 border border-emerald-900/40 rounded-lg text-emerald-300 text-xs font-semibold flex items-center gap-2`}
        >
          <Check className="w-4 h-4" />
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Import Form Toggle View */}
      {showImport && (
        <form onSubmit={handleImport} className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-blue-400 font-mono font-bold uppercase pb-1">
              <Code className="w-3.5 h-3.5" />
              <span>Bulk JSON Prompt Importer</span>
            </div>
            <p className="text-slate-400 text-xs mt-1">
              Paste your prompt export JSON or standard structures in array format. Each element must contain <strong>name</strong> and <strong>content</strong> keys.
            </p>
          </div>
          <textarea
            required
            rows={5}
            placeholder='[ { "name": "Expert Code Auditing", "content": "Analyze this code: {{code}}", "category": "engineering" } ]'
            value={importJson}
            onChange={(e) => setImportJson(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs text-slate-300 font-mono focus:outline-none focus:border-blue-500"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowImport(false)}
              className="bg-slate-950 hover:bg-slate-900 text-slate-400 text-xs px-3 py-1.5 rounded-lg border border-slate-850"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-1.5 rounded-lg font-bold"
            >
              Execute Import Ingestion
            </button>
          </div>
        </form>
      )}

      {/* Creation and Modification Form View */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-blue-400" />
              <h3 className="text-sm font-bold text-white">
                {editingTemplate ? "Modify Prompt Template" : "Add Prompt Template Schema"}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-slate-500 hover:text-white text-xs font-mono"
            >
              CLOSE
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div>
              <label className="block text-[10px] font-mono text-slate-500 font-bold mb-1.5 uppercase">Template Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Code Optimizer V2"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 font-bold mb-1.5 uppercase">Category</label>
              <input
                type="text"
                required
                placeholder="e.g. development, legal, creative"
                value={category}
                onChange={(e) => setCategory(e.target.value.toLowerCase())}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-mono text-slate-500 font-bold mb-1.5 uppercase">Version Label</label>
              <input
                type="text"
                required
                placeholder="1.0.0"
                value={version}
                onChange={(e) => setVersion(e.target.value)}
                className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-mono text-slate-500 font-bold mb-1.5 uppercase">Template Description</label>
            <input
              type="text"
              placeholder="Provide a concise manual on what parameters this template expects..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-lg px-3 py-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-[10px] font-mono text-slate-500 font-bold uppercase">Prompt Content (System or User instructions)</label>
              <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                <span>Wrap variables like this: {"{{variable_name}}"}</span>
              </span>
            </div>
            <textarea
              required
              rows={5}
              placeholder="You are an expert system engineer. Optimize the following function: {{function_body}}"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full bg-slate-950 border border-slate-850 rounded-lg p-3 text-xs text-slate-300 font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="is-public-tmpl"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-blue-600 focus:ring-0 focus:ring-offset-0 w-3.5 h-3.5"
              />
              <label htmlFor="is-public-tmpl" className="text-xs text-slate-300 select-none">
                Make template public within the organization workspace
              </label>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="bg-slate-950 hover:bg-slate-900 border border-slate-850 text-slate-400 text-xs px-4 py-1.5 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-4 py-1.5 rounded-lg font-bold"
              >
                Save Template Specification
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Filter and Search Action row */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-slate-900 border border-slate-800 rounded-xl p-4">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search templates or content..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans transition-all"
          />
        </div>

        {/* Categories filters tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pr-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all shrink-0 ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white"
                  : "bg-slate-950/40 border border-slate-850 text-slate-400 hover:bg-slate-800 hover:text-slate-200"
              }`}
            >
              {cat === "all" ? "All Categories" : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Templates Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-20">
          <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-xl py-24 text-center">
          <Sparkles className="w-12 h-12 mx-auto mb-3 text-slate-700 animate-pulse" />
          <span className="block text-sm font-semibold text-slate-400">No prompt templates found</span>
          <span className="block text-xs text-slate-600 mt-1">Start adding customized prompts or try searching another category.</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((tmpl) => (
            <div
              key={tmpl.id}
              onClick={() => handleOpenEdit(tmpl)}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-slate-700 hover:shadow-lg hover:shadow-slate-950/50 transition-all cursor-pointer flex flex-col justify-between h-[280px] group relative"
            >
              {/* Star toggle icon */}
              <button
                onClick={(e) => toggleFavorite(tmpl.id, e)}
                className="absolute right-4 top-4 text-slate-500 hover:text-amber-400 transition-colors"
                title="Mark Favorite"
              >
                <Star className={`w-4 h-4 ${tmpl.isFavorite ? "text-amber-400 fill-amber-400" : ""}`} />
              </button>

              <div className="space-y-3">
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 bg-blue-950/40 text-blue-400 border border-blue-900/15 text-[10px] rounded font-bold uppercase tracking-wide font-mono">
                    {tmpl.category}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono font-bold">V{tmpl.version}</span>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors truncate pr-6">
                    {tmpl.name}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                    {tmpl.description || "No manual instructions described."}
                  </p>
                </div>

                <div className="bg-slate-950 border border-slate-850 rounded-lg p-2.5 h-16 overflow-hidden relative">
                  <span className="block text-[10px] font-mono text-slate-500 select-none whitespace-pre-wrap leading-relaxed truncate">
                    {tmpl.content}
                  </span>
                  <div className="absolute inset-x-0 bottom-0 h-5 bg-gradient-to-t from-slate-950 to-transparent pointer-events-none" />
                </div>
              </div>

              {/* Bottom tools row */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-850 mt-4">
                {tmpl.variables && tmpl.variables.length > 0 ? (
                  <div className="flex items-center gap-1 overflow-hidden max-w-[150px]">
                    <Tag className="w-3 h-3 text-slate-500 shrink-0" />
                    <span className="text-[9px] font-mono text-blue-400 truncate uppercase">
                      {tmpl.variables.join(", ")}
                    </span>
                  </div>
                ) : (
                  <span className="text-[9px] font-mono text-slate-600">No parameters</span>
                )}

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={(e) => copyToClipboard(tmpl.content, tmpl.id, e)}
                    className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-850 rounded transition-all"
                    title="Copy full Prompt"
                  >
                    {copiedId === tmpl.id ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400 animate-bounce" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <button
                    onClick={(e) => handleDelete(tmpl.id, e)}
                    className="p-1.5 bg-slate-950 hover:bg-red-950/20 text-slate-500 hover:text-red-400 border border-slate-850 hover:border-red-900/10 rounded transition-all"
                    title="Remove Template"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  FolderOpen,
  FileText,
  Search,
  Tag,
  CheckCircle,
  Database,
  RefreshCw,
  Clock,
  Layers
} from "lucide-react";

interface Collection {
  id: string;
  name: string;
  description: string;
  projectId: string;
  createdAt: string;
}

interface DocumentModel {
  id: string;
  collectionId: string;
  name: string;
  sizeBytes: number;
  mimeType: string;
  status: "indexed" | "pending" | "failed";
  tags: string[];
  chunksCount: number;
  createdAt: string;
}

interface KnowledgeBaseTabProps {
  token: string;
  activeProjectId: string | null;
}

export default function KnowledgeBaseTab({ token, activeProjectId }: KnowledgeBaseTabProps) {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [selectedCol, setSelectedCol] = useState<Collection | null>(null);
  const [documents, setDocuments] = useState<DocumentModel[]>([]);
  const [loading, setLoading] = useState(false);
  const [docsLoading, setDocsLoading] = useState(false);

  // Search filter
  const [searchQuery, setSearchQuery] = useState("");

  // Creation States
  const [newColName, setNewColName] = useState("");
  const [newColDesc, setNewColDesc] = useState("");
  const [showColForm, setShowColForm] = useState(false);

  const [newDocName, setNewDocName] = useState("");
  const [newDocContent, setNewDocContent] = useState("");
  const [newDocTags, setNewDocTags] = useState("");
  const [showDocForm, setShowDocForm] = useState(false);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const showFeedback = (type: "success" | "error", msg: string) => {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  };

  const fetchCollections = async () => {
    setLoading(true);
    try {
      const url = activeProjectId ? `/api/kb/collections?projectId=${activeProjectId}` : "/api/kb/collections";
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setCollections(data);
        if (data.length > 0 && !selectedCol) {
          setSelectedCol(data[0]);
        }
      }
    } catch (e) {
      console.error("KB collections load failure:", e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocuments = async (colId: string) => {
    setDocsLoading(true);
    try {
      const res = await fetch(`/api/kb/collections/${colId}/documents`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setDocuments(data);
      }
    } catch (e) {
      console.error("KB documents load failure:", e);
    } finally {
      setDocsLoading(false);
    }
  };

  useEffect(() => {
    fetchCollections();
  }, [activeProjectId]);

  useEffect(() => {
    if (selectedCol) {
      fetchDocuments(selectedCol.id);
    } else {
      setDocuments([]);
    }
  }, [selectedCol]);

  const handleCreateCollection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColName.trim() || !activeProjectId) return;

    try {
      const res = await fetch("/api/kb/collections", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newColName,
          description: newColDesc,
          projectId: activeProjectId
        })
      });

      if (res.ok) {
        const created = await res.json();
        setCollections([...collections, created]);
        setSelectedCol(created);
        setNewColName("");
        setNewColDesc("");
        setShowColForm(false);
        showFeedback("success", `Collection "${created.name}" created successfully.`);
      } else {
        showFeedback("error", "Failed to create collection.");
      }
    } catch {
      showFeedback("error", "Error contacting knowledge base server.");
    }
  };

  const handleDeleteCollection = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this collection and all indexed documents?")) return;

    try {
      const res = await fetch(`/api/kb/collections/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setCollections(collections.filter(c => c.id !== id));
        if (selectedCol?.id === id) {
          setSelectedCol(null);
        }
        showFeedback("success", "Collection deleted.");
      }
    } catch {
      showFeedback("error", "Failed to delete collection.");
    }
  };

  const handleCreateDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCol || !newDocName.trim() || !newDocContent.trim()) return;

    try {
      const tagsArray = newDocTags
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const res = await fetch(`/api/kb/collections/${selectedCol.id}/documents`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          name: newDocName,
          content: newDocContent,
          tags: tagsArray
        })
      });

      if (res.ok) {
        const created = await res.json();
        setDocuments([...documents, created]);
        setNewDocName("");
        setNewDocContent("");
        setNewDocTags("");
        setShowDocForm(false);
        showFeedback("success", `Document "${created.name}" queued and fully indexed into vector embeddings.`);
      } else {
        showFeedback("error", "Failed to index document.");
      }
    } catch {
      showFeedback("error", "Error connecting to indexing worker.");
    }
  };

  const handleDeleteDocument = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this document from the knowledge index?")) return;

    try {
      const res = await fetch(`/api/kb/documents/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        setDocuments(documents.filter(d => d.id !== id));
        showFeedback("success", "Document removed.");
      }
    } catch {
      showFeedback("error", "Failed to remove document.");
    }
  };

  // Filter documents based on search query
  const filteredDocs = documents.filter(doc => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      doc.name.toLowerCase().includes(q) ||
      doc.tags.some(t => t.toLowerCase().includes(q))
    );
  });

  return (
    <div id="knowledge-base-tab" className="p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight text-white">RAG Knowledge Base</h2>
          <p className="text-slate-400 text-sm mt-1">
            Construct structured knowledge collections to augment AI prompts with real-time vector embeddings search
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={fetchCollections}
            className="bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 p-2.5 rounded-lg text-sm transition-all"
            title="Refresh Knowledge Index"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            id="kb-btn-add-collection"
            onClick={() => setShowColForm(!showColForm)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-lg flex items-center gap-2 shadow-sm shadow-blue-500/10 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Create Collection</span>
          </button>
        </div>
      </div>

      {feedback && (
        <div
          id="kb-feedback"
          className={`p-3.5 border rounded-lg text-xs font-semibold flex items-center gap-2 ${
            feedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-900/45 text-emerald-300"
              : "bg-red-950/40 border-red-900/45 text-red-300"
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          <span>{feedback.msg}</span>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Collections List (4 cols) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col h-[650px]">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800 mb-4">
            <Layers className="w-4.5 h-4.5 text-blue-400" />
            <h3 className="text-xs font-mono font-bold tracking-wider text-slate-400 uppercase">Collections</h3>
          </div>

          {showColForm && (
            <form onSubmit={handleCreateCollection} className="bg-slate-950 border border-slate-850 p-4 rounded-lg mb-4 space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-bold mb-1 uppercase">Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Legal Compliance PDFs"
                  value={newColName}
                  onChange={(e) => setNewColName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono text-slate-500 font-bold mb-1 uppercase">Description</label>
                <textarea
                  placeholder="Summarize what files this collection contains..."
                  value={newColDesc}
                  onChange={(e) => setNewColDesc(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex justify-end gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowColForm(false)}
                  className="bg-slate-900 hover:bg-slate-800 text-slate-400 text-[10px] px-2.5 py-1 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-[10px] px-2.5 py-1 rounded"
                >
                  Add
                </button>
              </div>
            </form>
          )}

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1">
            {collections.length === 0 ? (
              <div className="text-center py-16 text-slate-600">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <span className="text-xs">No collections created.</span>
              </div>
            ) : (
              collections.map((col) => {
                const isActive = selectedCol?.id === col.id;
                return (
                  <div
                    key={col.id}
                    onClick={() => setSelectedCol(col)}
                    className={`p-3.5 border rounded-lg cursor-pointer transition-all flex items-start justify-between group ${
                      isActive
                        ? "bg-blue-600/10 border-blue-500/30"
                        : "bg-slate-950/40 border-slate-850 hover:bg-slate-800/20"
                    }`}
                  >
                    <div className="flex items-start gap-2.5 min-w-0">
                      <FolderOpen className={`w-4 h-4 shrink-0 mt-0.5 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                      <div className="min-w-0">
                        <span className={`block text-xs font-bold truncate ${isActive ? "text-blue-400" : "text-white"}`}>
                          {col.name}
                        </span>
                        <span className="block text-[11px] text-slate-500 truncate mt-0.5">
                          {col.description || "No description provided."}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteCollection(col.id, e)}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 p-0.5 transition-all shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Documents List & Indexing (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col h-[650px]">
          {selectedCol ? (
            <>
              {/* Active Collection Header Info */}
              <div className="border-b border-slate-800 pb-4 mb-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-1.5 text-xs text-blue-400 font-mono font-bold uppercase">
                    <Database className="w-3.5 h-3.5" />
                    <span>Selected Collection</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mt-1">{selectedCol.name}</h3>
                  <p className="text-slate-400 text-xs mt-0.5">{selectedCol.description || "No description loaded."}</p>
                </div>
                <button
                  id="kb-btn-add-doc"
                  onClick={() => setShowDocForm(!showDocForm)}
                  className="bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-500/20 font-bold text-xs px-3.5 py-2 rounded flex items-center gap-1.5 transition-all self-start"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Index New Document</span>
                </button>
              </div>

              {/* Ingest document Form */}
              {showDocForm && (
                <form onSubmit={handleCreateDocument} className="bg-slate-950 border border-slate-850 p-5 rounded-lg mb-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 font-bold mb-1 uppercase">Document Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. system_security_guidelines.txt"
                        value={newDocName}
                        onChange={(e) => setNewDocName(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-slate-500 font-bold mb-1 uppercase">Tags (comma-separated)</label>
                      <input
                        type="text"
                        placeholder="e.g. security, audit, compliance"
                        value={newDocTags}
                        onChange={(e) => setNewDocTags(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-500 font-bold mb-1 uppercase">Document Text Content</label>
                    <textarea
                      required
                      rows={6}
                      placeholder="Paste the full document text that you want parsed and indexed into vector database chunks..."
                      value={newDocContent}
                      onChange={(e) => setNewDocContent(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-sans"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowDocForm(false)}
                      className="bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 text-xs px-3.5 py-1.5 rounded-lg font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3.5 py-1.5 rounded-lg font-bold flex items-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Start Vector Chunking</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Search documents bar */}
              <div className="relative mb-4">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search collection documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-850 rounded-lg pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-sans transition-all"
                />
              </div>

              {/* Documents table list */}
              <div className="flex-1 overflow-y-auto pr-1">
                {docsLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <RefreshCw className="w-6 h-6 text-blue-500 animate-spin" />
                  </div>
                ) : filteredDocs.length === 0 ? (
                  <div className="text-center py-20 text-slate-600">
                    <FileText className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <span className="text-xs">No documents indexed yet in this collection.</span>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 group hover:border-slate-800 transition-all"
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="w-8 h-8 rounded bg-blue-600/10 flex items-center justify-center shrink-0 border border-blue-500/10 mt-0.5">
                            <FileText className="w-4.5 h-4.5 text-blue-400" />
                          </div>
                          <div className="min-w-0">
                            <span className="block text-xs font-bold text-white font-mono truncate">{doc.name}</span>
                            <div className="flex items-center gap-2 mt-1 flex-wrap text-[10px] text-slate-500">
                              <span className="font-mono">{(doc.sizeBytes / 1024).toFixed(1)} KB</span>
                              <span>•</span>
                              <span className="font-mono">{doc.chunksCount} chunks</span>
                              <span>•</span>
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-600" />
                                <span>{new Date(doc.createdAt).toLocaleDateString()}</span>
                              </div>
                            </div>
                            {doc.tags && doc.tags.length > 0 && (
                              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                {doc.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-slate-900 border border-slate-800 text-[9px] text-slate-400 rounded-full flex items-center gap-1"
                                  >
                                    <Tag className="w-2.5 h-2.5 text-slate-500" />
                                    <span>{tag}</span>
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0 self-end md:self-auto">
                          <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/15 text-[10px] px-2 py-0.5 rounded font-bold uppercase tracking-wider font-mono">
                            {doc.status}
                          </span>
                          <button
                            onClick={() => handleDeleteDocument(doc.id)}
                            className="text-slate-600 hover:text-red-400 p-1.5 bg-slate-900 border border-slate-850 hover:border-red-950/20 rounded-lg transition-all"
                            title="Remove Index"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-500 text-center">
              <div>
                <Database className="w-12 h-12 mx-auto mb-3 text-slate-600 animate-pulse" />
                <span className="block text-sm font-semibold text-slate-400">Select or Create a Collection</span>
                <span className="block text-xs text-slate-600 mt-1">Ingest custom business intelligence files to unlock deep search.</span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

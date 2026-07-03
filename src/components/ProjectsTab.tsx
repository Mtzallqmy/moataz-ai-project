import React, { useState, useEffect } from "react";
import {
  FolderOpen,
  FileCode,
  UploadCloud,
  Plus,
  Trash2,
  Download,
  Link,
  Sparkles,
  Layers,
  CheckCircle,
  FileText
} from "lucide-react";
import { Project, FileModel } from "../types";

interface ProjectsTabProps {
  token: string;
  projects: Project[];
  activeProjectId: string | null;
  onRefreshProjects: () => void;
  setActiveProjectId: (id: string | null) => void;
}

export default function ProjectsTab({
  token,
  projects,
  activeProjectId,
  onRefreshProjects,
  setActiveProjectId
}: ProjectsTabProps) {
  const [files, setFiles] = useState<FileModel[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Workspace creation
  const [newProjName, setNewProjName] = useState("");
  const [newProjDesc, setNewProjDesc] = useState("");
  const [projError, setProjError] = useState<string | null>(null);

  // File Upload
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  const fetchFiles = async () => {
    if (!activeProjectId) return;
    try {
      const response = await fetch(`/api/files?projectId=${activeProjectId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      setFiles(data);
    } catch {}
  };

  useEffect(() => {
    fetchFiles();
  }, [activeProjectId]);

  // Create workspace project
  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;
    setProjError(null);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newProjName, description: newProjDesc })
      });
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create project");
      }

      setNewProjName("");
      setNewProjDesc("");
      onRefreshProjects();
      setActiveProjectId(data.id);
    } catch (err: any) {
      setProjError(err.message);
    }
  };

  const handleDeleteProject = async (id: string) => {
    if (!confirm("Are you sure you want to delete this workspace and ALL associated files and chats?")) return;
    try {
      const res = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        onRefreshProjects();
        setActiveProjectId(projects.length > 0 ? projects[0].id : null);
      }
    } catch {}
  };

  // Drag and Drop Base64 uploader helper
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeProjectId) return;

    setLoading(true);
    setUploadError(null);
    setUploadSuccess(false);

    const reader = new FileReader();
    reader.onload = async () => {
      try {
        // Strip data:image/png;base64, prefix
        const base64Url = reader.result as string;
        const base64Data = base64Url.split(",")[1];

        const response = await fetch("/api/files", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            name: file.name,
            mimeType: file.type || "application/octet-stream",
            base64Data,
            projectId: activeProjectId
          })
        });

        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || "Upload failed");
        }

        setUploadSuccess(true);
        fetchFiles();
      } catch (err: any) {
        setUploadError(err.message);
      } finally {
        setLoading(false);
      }
    };

    reader.onerror = () => {
      setUploadError("Failed to read file binary buffer");
      setLoading(false);
    };

    reader.readAsDataURL(file);
  };

  const handleDeleteFile = async (id: string) => {
    if (!confirm("Are you sure you want to delete this file?")) return;
    try {
      const res = await fetch(`/api/files/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        setFiles(files.filter((f) => f.id !== id));
      }
    } catch {}
  };

  // Tests signed URL generation and opens alert
  const handleTestSignedUrl = async (id: string) => {
    try {
      const res = await fetch(`/api/files/signed-url/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      alert(`Simulated pre-signed URL generated successfully:\n\n${data.url}`);
    } catch {
      alert("Failed to generate pre-signed link.");
    }
  };

  const activeProject = projects.find((p) => p.id === activeProjectId);

  return (
    <div id="projects-tab-panel" className="p-8 max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* 1. Left panel: Manage Workspaces */}
      <div className="space-y-6 lg:col-span-1">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <Layers className="w-4.5 h-4.5 text-blue-400" />
            <h3 className="text-base font-semibold text-white">Workspaces</h3>
          </div>

          {projError && (
            <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-300 text-xs">
              {projError}
            </div>
          )}

          {/* Create new workspace form */}
          <form onSubmit={handleCreateProject} className="space-y-3">
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1" htmlFor="new-workspace-name">
                Workspace Name
              </label>
              <input
                id="new-workspace-name"
                type="text"
                required
                placeholder="Marketing Campaign AI"
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg px-3 py-2 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-slate-400 text-xs font-semibold mb-1" htmlFor="new-workspace-desc">
                Description
              </label>
              <textarea
                id="new-workspace-desc"
                rows={2}
                placeholder="Holds models instructions, routing maps, and file uploads for SEO bots."
                value={newProjDesc}
                onChange={(e) => setNewProjDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-lg p-3 text-xs focus:border-blue-500 focus:outline-none resize-none"
              />
            </div>

            <button
              id="projects-create-workspace-btn"
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Workspace</span>
            </button>
          </form>

          {/* List of other workspaces with deletion option */}
          <div className="pt-4 space-y-2">
            <span className="block text-[10px] font-mono font-bold text-slate-500 tracking-wider">
              MY WORKSPACES
            </span>
            <div className="space-y-2">
              {projects.map((p) => {
                const isActive = p.id === activeProjectId;
                return (
                  <div
                    key={p.id}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all ${
                      isActive
                        ? "bg-slate-850 border-slate-700 text-white"
                        : "bg-slate-950/40 border-slate-850 hover:bg-slate-800/40 text-slate-400"
                    }`}
                  >
                    <button
                      onClick={() => setActiveProjectId(p.id)}
                      className="text-left font-sans font-semibold truncate flex-grow mr-2 cursor-pointer"
                    >
                      {p.name}
                    </button>
                    <button
                      onClick={() => handleDeleteProject(p.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 2. Right panel: File Upload and Directory Explorer (2 cols) */}
      <div className="space-y-6 lg:col-span-2">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <FolderOpen className="w-4.5 h-4.5 text-blue-400" />
              <div>
                <h3 className="text-base font-semibold text-white">Files Explorer</h3>
                <p className="text-slate-400 text-xs mt-0.5">Manage and mount reference documents in the active workspace</p>
              </div>
            </div>
            <span className="text-xs text-slate-400 font-mono font-bold">
              {files.length} Document(s)
            </span>
          </div>

          {/* Drag and Drop Upload container */}
          {activeProjectId ? (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-800 hover:border-blue-500/40 rounded-xl p-6 flex flex-col items-center justify-center text-center transition-all bg-slate-950/40 group relative cursor-pointer">
                <UploadCloud className="w-10 h-10 text-slate-500 group-hover:text-blue-400 transition-colors mb-3" />
                <span className="block text-xs font-semibold text-white mb-1">
                  Drag and drop files, or browse local
                </span>
                <span className="text-[10px] text-slate-500 font-semibold block">
                  PDF, TXT, JSON, DOCX up to 50MB (Base64 encoded proxy)
                </span>
                <input
                  id="projects-file-picker"
                  type="file"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
              </div>

              {loading && (
                <div className="flex items-center gap-2.5 text-xs text-slate-400 font-semibold bg-slate-950 p-3 rounded-lg border border-slate-850">
                  <span className="w-4 h-4 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
                  <span>Parsing file stream and uploading to S3...</span>
                </div>
              )}

              {uploadError && (
                <div className="p-3 bg-red-950/40 border border-red-900/50 rounded-lg text-red-300 text-xs font-semibold">
                  {uploadError}
                </div>
              )}

              {uploadSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-900/50 rounded-lg text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Document parsed and indexed on storage provider successfully!</span>
                </div>
              )}
            </div>
          ) : (
            <div className="p-6 bg-slate-950/60 rounded-xl text-center text-slate-500 text-xs">
              Create and select a workspace to upload document references.
            </div>
          )}

          {/* Directory Listings */}
          <div className="space-y-3 pt-2">
            <span className="block text-[10px] font-mono font-bold text-slate-500 tracking-wider">
              WORKSPACE DOCUMENTS
            </span>

            {files.length === 0 ? (
              <div className="py-8 bg-slate-950/30 border border-slate-850 rounded-xl text-center text-slate-500 text-xs">
                No documents found in this workspace. Upload reference PDFs, manuals or instruction scripts above.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="bg-slate-950 border border-slate-850 p-4 rounded-xl space-y-4 flex flex-col justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-600/10 flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="overflow-hidden">
                        <span className="block text-xs font-semibold text-white truncate">{file.name}</span>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                          {(file.sizeBytes / 1024).toFixed(1)} KB • {file.mimeType}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-slate-850 pt-3">
                      <div className="flex gap-1">
                        {/* Download anchor triggers actual binary download */}
                        <a
                          id={`file-download-lnk-${file.id}`}
                          href={`/api/files/download/${file.id}`}
                          download={file.name}
                          className="bg-slate-900 hover:bg-slate-800 text-slate-300 p-2 rounded-lg text-xs transition-colors block"
                          title="Download document binary"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          id={`file-presigned-btn-${file.id}`}
                          onClick={() => handleTestSignedUrl(file.id)}
                          className="bg-slate-900 hover:bg-slate-800 text-slate-300 p-2 rounded-lg text-xs transition-colors"
                          title="Generate pre-signed S3 URL"
                        >
                          <Link className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteFile(file.id)}
                        className="bg-slate-900 hover:bg-red-950/20 text-slate-500 hover:text-red-400 border border-slate-850 hover:border-red-900/30 p-2 rounded-lg text-xs transition-all"
                        title="Delete reference"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

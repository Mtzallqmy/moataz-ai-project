import React, { useState, useEffect } from "react";
import { User, Project } from "./types";
import AuthScreen from "./components/AuthScreen";
import Sidebar from "./components/Sidebar";
import DashboardTab from "./components/DashboardTab";
import ChatTab from "./components/ChatTab";
import ProjectsTab from "./components/ProjectsTab";
import AnalyticsTab from "./components/AnalyticsTab";
import AdminTab from "./components/AdminTab";
import KnowledgeBaseTab from "./components/KnowledgeBaseTab";
import PromptLibraryTab from "./components/PromptLibraryTab";
import SystemSettingsTab from "./components/SystemSettingsTab";
import AgentPlatformTab from "./components/AgentPlatformTab";
import { translations } from "./i18n/translations";

export default function App() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("mz_token"));
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("mz_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [lang, setLang] = useState<'en' | 'ar'>(() => (localStorage.getItem("mz_lang") as 'en' | 'ar') || 'ar');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("mz_theme") !== 'light');

  const [activeTab, setActiveTab] = useState("dashboard");
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [loadingWorkspace, setLoadingWorkspace] = useState(false);

  const t = translations[lang];

  useEffect(() => {
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    localStorage.setItem("mz_lang", lang);
  }, [lang]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem("mz_theme", 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem("mz_theme", 'light');
    }
  }, [darkMode]);

  const fetchWorkspaces = async (sessionToken: string) => {
    setLoadingWorkspace(true);
    try {
      const response = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        if (data.length > 0 && !activeProjectId) {
          setActiveProjectId(data[0].id);
        }
      }
    } catch (e) {
      console.error("Workspace syncing error:", e);
    } finally {
      setLoadingWorkspace(false);
    }
  };

  const refreshUserData = async (sessionToken: string) => {
    try {
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        localStorage.setItem("mz_user", JSON.stringify(data.user));
      }
    } catch {}
  };

  useEffect(() => {
    if (token) {
      fetchWorkspaces(token);
      refreshUserData(token);
    }
  }, [token]);

  const handleAuthSuccess = (sessionToken: string, authedUser: User) => {
    setToken(sessionToken);
    setUser(authedUser);
    localStorage.setItem("mz_token", sessionToken);
    localStorage.setItem("mz_user", JSON.stringify(authedUser));
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("mz_token");
    localStorage.removeItem("mz_user");
  };

  if (!token || !user) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard": return <DashboardTab user={user} projects={projects} activeProjectId={activeProjectId} onNavigateTab={setActiveTab} token={token} />;
      case "chat": return <ChatTab token={token} projects={projects} activeProjectId={activeProjectId} />;
      case "projects": return <ProjectsTab token={token} projects={projects} activeProjectId={activeProjectId} onRefreshProjects={() => fetchWorkspaces(token)} setActiveProjectId={setActiveProjectId} />;
      case "admin": return user.role === "ADMIN" ? <AdminTab token={token} /> : null;
      default: return <div className="p-8 text-center">{t.welcome}</div>;
    }
  };

  return (
    <div className={`min-h-screen flex ${darkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <Sidebar
        user={user}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        lang={lang}
        setLang={setLang}
      />
      <div className={`flex-1 ${lang === 'ar' ? 'pr-64' : 'pl-64'} transition-all duration-300`}>
        {renderTabContent()}
      </div>
    </div>
  );
}

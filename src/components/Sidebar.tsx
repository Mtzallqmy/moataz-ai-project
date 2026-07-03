import React from "react";
import { Sparkles, LayoutDashboard, MessageSquare, FolderKanban, CreditCard, Sliders, ShieldCheck, LogOut, Sun, Moon, Languages, Cpu, BookOpen, Layers } from "lucide-react";
import { User, Project } from "../types";
import { translations } from "../i18n/translations";

interface SidebarProps {
  user: User;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  projects: Project[];
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  onLogout: () => void;
  darkMode: boolean;
  setDarkMode: (dark: boolean) => void;
  lang: 'en' | 'ar';
  setLang: (lang: 'en' | 'ar') => void;
}

export default function Sidebar({ user, activeTab, setActiveTab, projects, activeProjectId, setActiveProjectId, onLogout, darkMode, setDarkMode, lang, setLang }: SidebarProps) {
  const t = translations[lang];
  const isAdmin = user.role === "ADMIN";

  const navItems = [
    { id: "dashboard", label: t.dashboard, icon: LayoutDashboard },
    { id: "chat", label: t.chat, icon: MessageSquare },
    { id: "projects", label: t.projects, icon: FolderKanban },
    { id: "agents", label: t.agentPlatform, icon: Cpu },
    { id: "knowledge", label: t.knowledgeBase, icon: BookOpen },
    { id: "prompts", label: t.promptLibrary, icon: Layers },
    { id: "billing", label: t.analytics, icon: CreditCard },
    { id: "settings", label: t.settings, icon: Sliders },
  ];

  return (
    <aside className={`w-64 border-x flex flex-col justify-between h-screen fixed top-0 ${lang === 'ar' ? 'right-0' : 'left-0'} z-50 transition-all duration-300 ${darkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
      <div className="flex flex-col flex-1 overflow-y-auto">
        <div className={`p-6 flex items-center gap-3 border-b ${darkMode ? 'border-slate-800/50' : 'border-slate-200'}`}>
          <div className="w-9 h-9 bg-blue-600 rounded-lg flex items-center justify-center shadow-md shadow-blue-500/15">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className={`font-bold text-base tracking-tight block ${darkMode ? 'text-white' : 'text-slate-900'}`}>معتز AI</span>
            <span className="text-[10px] font-mono text-blue-400 tracking-wider font-semibold uppercase">Enterprise Platform</span>
          </div>
        </div>

        <div className="p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? "bg-blue-600/10 text-blue-400 border border-blue-500/15"
                    : `hover:bg-slate-800/50 hover:text-slate-200 border border-transparent ${darkMode ? 'text-slate-400' : 'text-slate-600'}`
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-blue-400" : "text-slate-400"}`} />
                <span>{item.label}</span>
              </button>
            );
          })}

          {isAdmin && (
            <div className={`pt-4 border-t ${darkMode ? 'border-slate-800/50' : 'border-slate-200'} mt-4`}>
              <button
                onClick={() => setActiveTab("admin")}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === "admin"
                    ? "bg-violet-600/10 text-violet-400 border border-violet-500/15"
                    : `hover:bg-slate-800/50 hover:text-slate-200 border border-transparent ${darkMode ? 'text-slate-400' : 'text-slate-600'}`
                }`}
              >
                <ShieldCheck className={`w-4 h-4 ${activeTab === "admin" ? "text-violet-400" : "text-slate-400"}`} />
                <span>{t.admin}</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`p-4 border-t ${darkMode ? 'border-slate-800/50' : 'border-slate-200'} space-y-2`}>
        <div className="flex gap-2">
          <button 
            onClick={() => setDarkMode(!darkMode)} 
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
          >
            {darkMode ? <Sun size={14} /> : <Moon size={14} />}
            <span>{darkMode ? t.lightMode : t.darkMode}</span>
          </button>
          <button 
            onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')} 
            className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${darkMode ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-600'}`}
          >
            <Languages size={14} />
            <span className="font-bold uppercase">{lang === 'ar' ? 'EN' : 'AR'}</span>
          </button>
        </div>
        <button 
          onClick={onLogout} 
          className={`w-full py-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-all ${darkMode ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
        >
          <LogOut size={14} />
          <span>{t.logout}</span>
        </button>
      </div>
    </aside>
  );
}

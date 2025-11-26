import React from 'react';
import { View } from '../types';
import { MessageSquare, Share2, Database, Layers, FileText } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  currentView: View;
  onViewChange: (view: View) => void;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, onViewChange }) => {
  const navItems = [
    { id: View.CHAT, label: 'Chat Retrieval', icon: MessageSquare },
    { id: View.GRAPH, label: 'Graph Explorer', icon: Share2 },
    { id: View.DATA_SOURCES, label: 'Data Sources', icon: FileText },
    { id: View.INGESTION, label: 'Data Ingestion', icon: Database },
  ];

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-slate-800">
          <div className="flex items-center gap-2 text-accent-500">
            <Layers className="h-6 w-6" />
            <span className="text-xl font-bold tracking-tight text-white">NEXUS</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-mono">v1.1 | Agentic RAG</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${
                  isActive 
                    ? 'bg-accent-600/10 text-accent-500 border border-accent-600/20' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? 'text-accent-500' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <span className="font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-xs font-bold">
                AI
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">Lead Researcher</p>
                <p className="text-xs text-slate-500 truncate">Workspace: /pdfs</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-16 bg-slate-900/50 backdrop-blur-sm border-b border-slate-800 flex items-center justify-between px-6 md:hidden">
          <div className="flex items-center gap-2 text-accent-500">
            <Layers className="h-6 w-6" />
            <span className="font-bold text-white">NEXUS</span>
          </div>
        </header>
        
        <div className="flex-1 overflow-hidden relative">
          {children}
        </div>
      </main>
    </div>
  );
};
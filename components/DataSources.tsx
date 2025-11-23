import React, { useEffect, useState } from 'react';
import { FileText, Sparkles, Calendar, Clock, Loader2, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Document } from '../types';
import { fetchDocuments, generateDocumentSummary } from '../services/api';

export const DataSources: React.FC = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedDocId, setExpandedDocId] = useState<string | null>(null);
  const [generatingSummaryFor, setGeneratingSummaryFor] = useState<string | null>(null);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const docs = await fetchDocuments();
      setDocuments(docs);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load documents.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, []);

  const toggleSummary = async (doc: Document) => {
    if (expandedDocId === doc.id) {
      setExpandedDocId(null);
      return;
    }

    setExpandedDocId(doc.id);

    // If no summary exists, generate one automatically
    if (!doc.summary && !generatingSummaryFor) {
      setGeneratingSummaryFor(doc.id);
      try {
        const summary = await generateDocumentSummary(doc.id);
        setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, summary } : d));
      } catch (err) {
        console.error("Summary generation failed", err);
      } finally {
        setGeneratingSummaryFor(null);
      }
    }
  };

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-950">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Data Sources</h1>
                <p className="text-slate-400">Knowledge base contents and AI-generated summaries.</p>
            </div>
            <button 
                onClick={loadDocuments}
                className="p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                title="Refresh List"
            >
                <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
        </div>

        {error && (
            <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 text-red-300">
                {error}
            </div>
        )}

        <div className="grid gap-4">
            {loading && documents.length === 0 && (
                <div className="text-center py-20 text-slate-500">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
                    Loading knowledge base...
                </div>
            )}

            {!loading && documents.length === 0 && (
                <div className="text-center py-20 text-slate-500 bg-slate-900/30 rounded-xl border border-dashed border-slate-800">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    No documents ingested yet. Go to Data Ingestion to start.
                </div>
            )}

            {documents.map((doc) => (
                <div key={doc.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden transition-all hover:border-slate-700">
                    <div 
                        className="p-4 md:p-6 flex items-center justify-between cursor-pointer"
                        onClick={() => toggleSummary(doc)}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                                <FileText className="w-5 h-5" />
                            </div>
                            <div>
                                <h3 className="font-medium text-white text-lg">{doc.filename}</h3>
                                <div className="flex items-center gap-4 text-xs text-slate-500 mt-1">
                                    <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {new Date(doc.upload_date).toLocaleDateString()}
                                    </span>
                                    <span className="flex items-center gap-1">
                                        <Clock className="w-3 h-3" />
                                        {new Date(doc.upload_date).toLocaleTimeString()}
                                    </span>
                                    <span className={`px-2 py-0.5 rounded-full ${doc.status === 'completed' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                                        {doc.status}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <button className="text-slate-500 hover:text-white">
                            {expandedDocId === doc.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                        </button>
                    </div>

                    {expandedDocId === doc.id && (
                        <div className="px-6 pb-6 pt-0 animate-in slide-in-from-top-2 duration-200">
                            <div className="bg-slate-950 rounded-lg p-5 border border-slate-800/50">
                                <div className="flex items-center gap-2 mb-3 text-accent-400 text-sm font-medium uppercase tracking-wider">
                                    <Sparkles className="w-4 h-4" />
                                    AI Summary
                                </div>
                                
                                {generatingSummaryFor === doc.id ? (
                                    <div className="flex items-center gap-3 text-slate-500 py-4">
                                        <Loader2 className="w-5 h-5 animate-spin text-accent-500" />
                                        Generating concise summary with Gemini...
                                    </div>
                                ) : (
                                    <p className="text-slate-300 leading-relaxed text-sm md:text-base">
                                        {doc.summary || "No summary available."}
                                    </p>
                                )}
                                
                                <div className="mt-4 pt-4 border-t border-slate-900 flex justify-end">
                                    <span className="text-[10px] text-slate-600 font-mono">
                                        Cached in PostgreSQL • Generated by Gemini 2.5
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            ))}
        </div>
      </div>
    </div>
  );
};

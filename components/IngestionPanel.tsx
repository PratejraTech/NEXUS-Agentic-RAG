import React, { useState } from 'react';
import { UploadCloud, Play, CheckCircle2, Circle, Cpu, Network, Trash2, Loader2, AlertTriangle, X, Settings2, Workflow } from 'lucide-react';
import { PipelineStatus, IngestionConfig } from '../types';
import { uploadFiles, triggerIngestion } from '../services/api';

export const IngestionPanel: React.FC = () => {
  const [pipeline, setPipeline] = useState<PipelineStatus>({
    isActive: false,
    progress: 0,
    currentAgent: '',
    steps: [
      { id: '1', name: 'LoaderAgent', status: 'idle', details: 'Extract text & metadata' },
      { id: '2', name: 'ChunkAgent', status: 'idle', details: 'Semantic chunking & overlap' },
      { id: '3', name: 'EmbedAgent', status: 'idle', details: 'Gemini embedding generation' },
      { id: '4', name: 'EntityAgent', status: 'idle', details: 'LLM-augmented extraction' },
      { id: '5', name: 'GraphWriterAgent', status: 'idle', details: 'Memgraph synchronization' },
      { id: '6', name: 'MetadataAgent', status: 'idle', details: 'PostgreSQL committing' }
    ]
  });

  const [config, setConfig] = useState<IngestionConfig>({
      chunkSize: 1000,
      chunkOverlap: 200,
      useOcr: false,
      recursionLimit: 25,
      useN8n: false,
      n8nWebhookUrl: 'http://localhost:5678/webhook/trigger' // Default placeholder
  });

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'uploaded'>('idle');
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files) {
      const newFiles = Array.from(e.target.files) as File[];
      const invalidFiles = newFiles.filter(f => f.size > 50 * 1024 * 1024);
      if (invalidFiles.length > 0) {
          setError(`File too large: ${invalidFiles[0].name}. Max size is 50MB.`);
          return;
      }
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setUploadStatus('idle'); 
    }
  };

  const removeFile = (index: number) => {
    setError(null);
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length <= 1) {
        setUploadStatus('idle');
    }
  };

  const startIngestion = async () => {
    if (selectedFiles.length === 0) return;
    setError(null);
    
    try {
        // 1. Upload Phase
        if (uploadStatus !== 'uploaded') {
            setUploadStatus('uploading');
            await uploadFiles(selectedFiles);
            setUploadStatus('uploaded');
        }

        // 2. Trigger Phase (with Config)
        await triggerIngestion(config);

        // 3. UI Simulation for Feedback
        // Note: Real state would come from websocket or polling in a production app
        setPipeline(prev => ({ ...prev, isActive: true, progress: 0, currentAgent: config.useN8n ? 'n8n Workflow' : 'LoaderAgent' }));
        
        if (config.useN8n) {
             // Just show a running state if N8n is handling it
             setTimeout(() => {
                  setPipeline(prev => ({ ...prev, isActive: false, currentAgent: 'Handed off to n8n' }));
             }, 3000);
             return;
        }

        // Mock simulation loop for local backend visualization
        let stepIndex = 0;
        const interval = setInterval(() => {
            setPipeline(prev => {
                const newSteps = [...prev.steps];
                if(stepIndex > 0) newSteps[stepIndex - 1].status = 'completed';
                if(stepIndex < newSteps.length) {
                    newSteps[stepIndex].status = 'running';
                    return {
                        isActive: true,
                        progress: ((stepIndex + 1) / newSteps.length) * 100,
                        currentAgent: newSteps[stepIndex].name,
                        steps: newSteps
                    }
                } else {
                    clearInterval(interval);
                    return {
                        isActive: false,
                        progress: 100,
                        currentAgent: 'Done',
                        steps: newSteps.map(s => ({...s, status: 'completed' as const}))
                    }
                }
            });
            stepIndex++;
        }, 1500);

    } catch (err: any) {
        console.error("Ingestion failed", err);
        setError(err.message || "Failed to start ingestion process.");
        setUploadStatus('idle');
        setPipeline(prev => ({ ...prev, isActive: false }));
    }
  };

  return (
    <div className="flex h-full bg-slate-950 overflow-hidden">
        {/* Main Panel */}
        <div className="flex-1 p-6 md:p-10 overflow-y-auto">
            <div className="max-w-4xl mx-auto space-y-8">
                <div>
                <h1 className="text-3xl font-bold text-white mb-2">Data Ingestion</h1>
                <p className="text-slate-400">Manage the LangGraph pipeline for processing document knowledge.</p>
                </div>

                {error && (
                    <div className="bg-red-950/30 border border-red-900/50 rounded-lg p-4 flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5" />
                        <div className="flex-1">
                            <h4 className="text-red-200 font-medium text-sm">Operation Failed</h4>
                            <p className="text-red-400 text-sm mt-1">{error}</p>
                        </div>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300"><X className="w-4 h-4" /></button>
                    </div>
                )}

                {/* Two Column Layout for Config + Upload */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Settings Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                        <h3 className="text-lg font-medium text-white mb-4 flex items-center gap-2">
                            <Settings2 className="w-5 h-5 text-accent-500" />
                            Orchestration Settings
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-sm text-slate-400">Chunk Size</label>
                                    <span className="text-sm text-slate-200 font-mono">{config.chunkSize}</span>
                                </div>
                                <input 
                                    type="range" min="200" max="2000" step="100"
                                    value={config.chunkSize}
                                    onChange={(e) => setConfig({...config, chunkSize: parseInt(e.target.value)})}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent-500"
                                    disabled={pipeline.isActive}
                                />
                            </div>

                            <div>
                                <div className="flex justify-between mb-1">
                                    <label className="text-sm text-slate-400">Overlap</label>
                                    <span className="text-sm text-slate-200 font-mono">{config.chunkOverlap}</span>
                                </div>
                                <input 
                                    type="range" min="0" max="500" step="50"
                                    value={config.chunkOverlap}
                                    onChange={(e) => setConfig({...config, chunkOverlap: parseInt(e.target.value)})}
                                    className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-accent-500"
                                    disabled={pipeline.isActive}
                                />
                            </div>
                            
                            <div className="flex items-center justify-between pt-2">
                                <span className="text-sm text-slate-400">Force OCR</span>
                                <button 
                                    onClick={() => setConfig({...config, useOcr: !config.useOcr})}
                                    disabled={pipeline.isActive}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${config.useOcr ? 'bg-accent-600' : 'bg-slate-700'}`}
                                >
                                    <span className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${config.useOcr ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                                <div className="flex items-center gap-2">
                                    <Workflow className="w-4 h-4 text-orange-500" />
                                    <span className="text-sm text-slate-300">Route via n8n</span>
                                </div>
                                <button 
                                    onClick={() => setConfig({...config, useN8n: !config.useN8n})}
                                    disabled={pipeline.isActive}
                                    className={`w-10 h-5 rounded-full relative transition-colors ${config.useN8n ? 'bg-orange-600' : 'bg-slate-700'}`}
                                >
                                    <span className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all ${config.useN8n ? 'left-6' : 'left-1'}`} />
                                </button>
                            </div>
                            
                            {config.useN8n && (
                                <div className="animate-in fade-in slide-in-from-top-1">
                                    <label className="text-xs text-slate-500 block mb-1">Webhook URL</label>
                                    <input 
                                        type="text"
                                        value={config.n8nWebhookUrl}
                                        onChange={(e) => setConfig({...config, n8nWebhookUrl: e.target.value})}
                                        className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-300 focus:outline-none focus:border-orange-500"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Upload Card */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col">
                         <div className={`flex-1 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-center transition-all relative group ${uploadStatus === 'uploading' ? 'border-slate-700 bg-slate-900/50 cursor-wait' : 'border-slate-700 hover:border-accent-500/50 hover:bg-slate-800/50 cursor-pointer'}`}>
                            <input 
                                type="file" multiple accept=".pdf,.txt,.md"
                                className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                                onChange={handleFileChange}
                                disabled={uploadStatus === 'uploading' || pipeline.isActive}
                            />
                            <div className="bg-slate-800 p-3 rounded-full mb-3 group-hover:bg-slate-700 transition-colors">
                                <UploadCloud className={`w-6 h-6 ${uploadStatus === 'uploading' ? 'text-slate-500' : 'text-accent-500'}`} />
                            </div>
                            <p className="text-sm text-slate-300 mb-1">Drop documents here</p>
                            <p className="text-xs text-slate-500">PDF, TXT, MD (Max 50MB)</p>
                        </div>

                        {selectedFiles.length > 0 && (
                            <div className="mt-4 flex flex-col gap-2">
                                <div className="text-xs font-medium text-slate-500 uppercase tracking-wider flex justify-between">
                                    <span>Staged ({selectedFiles.length})</span>
                                    {uploadStatus === 'uploaded' && <span className="text-green-500 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Ready</span>}
                                </div>
                                <div className="max-h-32 overflow-y-auto custom-scrollbar space-y-1">
                                    {selectedFiles.map((file, idx) => (
                                        <div key={idx} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs">
                                            <span className="text-slate-300 truncate max-w-[150px]">{file.name}</span>
                                            <button onClick={() => removeFile(idx)} className="text-slate-600 hover:text-red-500"><Trash2 className="w-3 h-3" /></button>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={startIngestion}
                                    disabled={pipeline.isActive || uploadStatus === 'uploading'}
                                    className={`mt-2 w-full py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg ${config.useN8n ? 'bg-orange-600 hover:bg-orange-500 shadow-orange-600/20' : 'bg-accent-600 hover:bg-accent-500 shadow-accent-600/20'} disabled:opacity-50 disabled:cursor-not-allowed text-white`}
                                >
                                    {uploadStatus === 'uploading' ? (
                                        <> <Loader2 className="w-4 h-4 animate-spin" /> Uploading... </>
                                    ) : pipeline.isActive ? (
                                        <> <Cpu className="w-4 h-4 animate-spin" /> Running... </>
                                    ) : (
                                        <> 
                                            {config.useN8n ? <Workflow className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                                            {config.useN8n ? 'Trigger n8n Workflow' : 'Start Pipeline'}
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Pipeline Visualization */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                    <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                            <Network className="w-4 h-4 text-accent-500" />
                            Multi-Agent Pipeline Status
                        </h3>
                        {pipeline.isActive && (
                            <span className="text-xs font-mono text-accent-400 animate-pulse">
                                RUNNING: {pipeline.currentAgent}
                            </span>
                        )}
                    </div>
                    
                    <div className="p-6">
                        <div className="relative">
                            <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-800"></div>
                            <div className="space-y-6 relative">
                                {pipeline.steps.map((step, idx) => {
                                    const isCompleted = step.status === 'completed';
                                    const isRunning = step.status === 'running';
                                    return (
                                        <div key={step.id} className="flex gap-4">
                                            <div className={`relative z-10 w-14 h-14 rounded-full border-4 flex items-center justify-center bg-slate-900 shrink-0 transition-all duration-300 ${
                                                isCompleted ? 'border-green-500/20 text-green-500' :
                                                isRunning ? 'border-accent-500/20 text-accent-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' :
                                                'border-slate-800 text-slate-600'
                                            }`}>
                                                {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : 
                                                isRunning ? <Cpu className="w-6 h-6 animate-spin" /> :
                                                <Circle className="w-6 h-6" />}
                                            </div>
                                            <div className={`flex-1 pt-1 ${isRunning ? 'opacity-100' : 'opacity-70'}`}>
                                                <div className="flex justify-between items-start">
                                                    <h4 className={`font-medium ${isRunning ? 'text-accent-400' : 'text-slate-200'}`}>
                                                        {step.name}
                                                    </h4>
                                                    <span className={`text-[10px] uppercase font-mono px-2 py-0.5 rounded ${
                                                        isCompleted ? 'bg-green-500/10 text-green-500' :
                                                        isRunning ? 'bg-accent-500/10 text-accent-500' :
                                                        'bg-slate-800 text-slate-500'
                                                    }`}>
                                                        {step.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-slate-500 mt-1">{step.details}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
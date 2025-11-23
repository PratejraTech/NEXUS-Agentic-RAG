import React, { useState } from 'react';
import { UploadCloud, Play, FileText, CheckCircle2, Circle, Cpu, Network, Trash2, Loader2 } from 'lucide-react';
import { PipelineStatus } from '../types';
import { uploadFiles } from '../services/api';

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

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'uploaded'>('idle');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
      setUploadStatus('idle'); // Reset if new files are added
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    if (selectedFiles.length <= 1) {
        setUploadStatus('idle');
    }
  };

  const startIngestion = async () => {
    if (selectedFiles.length === 0) return;
    
    try {
        // 1. Upload Phase
        if (uploadStatus !== 'uploaded') {
            setUploadStatus('uploading');
            await uploadFiles(selectedFiles);
            setUploadStatus('uploaded');
        }

        // 2. Pipeline Phase
        setPipeline(prev => ({ ...prev, isActive: true, progress: 0, currentAgent: 'LoaderAgent' }));
        
        // Mock simulation loop
        let stepIndex = 0;
        const interval = setInterval(() => {
            setPipeline(prev => {
                const newSteps = [...prev.steps];
                
                // Mark previous as completed
                if(stepIndex > 0) newSteps[stepIndex - 1].status = 'completed';
                
                // Mark current as running
                if(stepIndex < newSteps.length) {
                    newSteps[stepIndex].status = 'running';
                    return {
                        isActive: true,
                        progress: ((stepIndex + 1) / newSteps.length) * 100,
                        currentAgent: newSteps[stepIndex].name,
                        steps: newSteps
                    }
                } else {
                    // Done
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
    } catch (error) {
        console.error("Ingestion failed", error);
        setUploadStatus('idle');
    }
  };

  return (
    <div className="p-6 md:p-10 h-full overflow-y-auto bg-slate-950">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Data Ingestion</h1>
          <p className="text-slate-400">Manage the LangGraph pipeline for processing document knowledge.</p>
        </div>

        {/* Upload Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-8">
            <div className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center text-center transition-all relative group ${uploadStatus === 'uploading' ? 'border-slate-700 bg-slate-900/50 cursor-wait' : 'border-slate-700 hover:border-accent-500/50 hover:bg-slate-800/50 cursor-pointer'}`}>
                <input 
                    type="file" 
                    multiple 
                    accept=".pdf,.txt,.md"
                    className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
                    onChange={handleFileChange}
                    disabled={uploadStatus === 'uploading' || pipeline.isActive}
                />
                <div className="bg-slate-800 p-4 rounded-full mb-4 group-hover:bg-slate-700 transition-colors">
                    <UploadCloud className={`w-8 h-8 ${uploadStatus === 'uploading' ? 'text-slate-500' : 'text-accent-500'}`} />
                </div>
                <h3 className="text-lg font-medium text-white mb-1">Drop PDFs here or click to upload</h3>
                <p className="text-sm text-slate-500">Supports PDF, TXT, MD (Max 50MB)</p>
            </div>

            {selectedFiles.length > 0 && (
                <div className="mt-6 space-y-3">
                    <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-slate-400 uppercase tracking-wider">Staged Documents</h4>
                        {uploadStatus === 'uploaded' && (
                            <span className="text-xs font-medium text-green-500 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" /> Uploaded
                            </span>
                        )}
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {selectedFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded px-4 py-3 group">
                                <div className="flex items-center gap-3">
                                    <FileText className="w-4 h-4 text-slate-500" />
                                    <div className="flex flex-col">
                                        <span className="text-sm text-slate-200 font-medium truncate max-w-[200px] md:max-w-[400px]">{file.name}</span>
                                        <span className="text-xs text-slate-600">{(file.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => removeFile(idx)}
                                    disabled={uploadStatus === 'uploading' || pipeline.isActive}
                                    className="p-1.5 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded transition-colors disabled:opacity-30"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))}
                    </div>
                    
                    <button 
                        onClick={startIngestion}
                        disabled={pipeline.isActive || uploadStatus === 'uploading'}
                        className="mt-4 w-full py-3 bg-accent-600 hover:bg-accent-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-medium flex items-center justify-center gap-2 transition-all shadow-lg shadow-accent-600/20"
                    >
                        {uploadStatus === 'uploading' ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" /> Uploading Documents...
                            </>
                        ) : pipeline.isActive ? (
                            <>
                                <Cpu className="w-4 h-4 animate-spin" /> Processing Pipeline...
                            </>
                        ) : (
                            <>
                                <Play className="w-4 h-4 fill-current" /> 
                                {uploadStatus === 'uploaded' ? 'Start Ingestion Pipeline' : 'Upload & Ingest'}
                            </>
                        )}
                    </button>
                </div>
            )}
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
                    {/* Connecting Line */}
                    <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-slate-800"></div>
                    
                    <div className="space-y-6 relative">
                        {pipeline.steps.map((step, idx) => {
                            const isCompleted = step.status === 'completed';
                            const isRunning = step.status === 'running';
                            const isIdle = step.status === 'idle';

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
                                        
                                        {/* Micro-logs mockup */}
                                        {isRunning && (
                                            <div className="mt-2 bg-slate-950 border border-slate-800 p-2 rounded text-xs font-mono text-slate-400 animate-in slide-in-from-left-2 fade-in duration-300">
                                                &gt; Initializing {step.name}...<br/>
                                                &gt; Context loaded.<br/>
                                                &gt; Processing batch 1/4...
                                            </div>
                                        )}
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
  );
};
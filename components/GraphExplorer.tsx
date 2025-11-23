import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Search, ZoomIn, ZoomOut, RefreshCw, Filter } from 'lucide-react';
import { getMockGraphData } from '../services/api';
import { GraphData, GraphNode, GraphLink } from '../types';

export const GraphExplorer: React.FC = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [data, setData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [loading, setLoading] = useState(true);

  // Load data
  useEffect(() => {
    getMockGraphData().then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  // D3 Rendering
  useEffect(() => {
    if (!data || !svgRef.current || !containerRef.current) return;

    const width = containerRef.current.clientWidth;
    const height = containerRef.current.clientHeight;

    // Clear previous
    d3.select(svgRef.current).selectAll("*").remove();

    const svg = d3.select(svgRef.current)
      .attr("viewBox", [0, 0, width, height])
      .attr("width", width)
      .attr("height", height);

    // Zoom behavior
    const g = svg.append("g");
    
    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom);

    // Simulation
    const simulation = d3.forceSimulation<GraphNode>(data.nodes)
      .force("link", d3.forceLink<GraphNode, GraphLink>(data.links).id(d => d.id).distance(100))
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collide", d3.forceCollide().radius(d => (d as any).val * 4 + 10));

    // Links
    const link = g.append("g")
      .attr("stroke", "#334155")
      .attr("stroke-opacity", 0.6)
      .selectAll("line")
      .data(data.links)
      .join("line")
      .attr("stroke-width", 1);

    // Nodes
    const node = g.append("g")
      .selectAll("circle")
      .data(data.nodes)
      .join("circle")
      .attr("r", d => d.val * 3)
      .attr("fill", d => getNodeColor(d.type))
      .attr("stroke", "#1e293b")
      .attr("stroke-width", 1.5)
      .attr("cursor", "pointer")
      .call(drag(simulation) as any)
      .on("click", (event, d) => {
        event.stopPropagation();
        setSelectedNode(d);
      });
      
    // Labels (only for larger nodes to reduce clutter)
    const label = g.append("g")
        .selectAll("text")
        .data(data.nodes)
        .join("text")
        .text(d => d.val > 2 ? d.label : "")
        .attr("x", 8)
        .attr("y", 3)
        .attr("fill", "#94a3b8")
        .attr("font-size", "10px")
        .style("pointer-events", "none");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as any).x)
        .attr("y1", d => (d.source as any).y)
        .attr("x2", d => (d.target as any).x)
        .attr("y2", d => (d.target as any).y);

      node
        .attr("cx", d => (d as any).x)
        .attr("cy", d => (d as any).y);
        
      label
        .attr("x", d => (d as any).x + 8)
        .attr("y", d => (d as any).y + 3);
    });

    // Cleanup
    return () => {
      simulation.stop();
    };
  }, [data]);

  const getNodeColor = (type: string) => {
    switch (type) {
      case 'Person': return '#3b82f6'; // blue
      case 'Concept': return '#a855f7'; // purple
      case 'Organisation': return '#f97316'; // orange
      case 'Event': return '#ef4444'; // red
      case 'Document': return '#10b981'; // green
      default: return '#64748b';
    }
  };

  const drag = (simulation: d3.Simulation<GraphNode, undefined>) => {
    function dragstarted(event: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      event.subject.fx = event.subject.x;
      event.subject.fy = event.subject.y;
    }
    
    function dragged(event: any) {
      event.subject.fx = event.x;
      event.subject.fy = event.y;
    }
    
    function dragended(event: any) {
      if (!event.active) simulation.alphaTarget(0);
      event.subject.fx = null;
      event.subject.fy = null;
    }
    
    return d3.drag()
      .on("start", dragstarted)
      .on("drag", dragged)
      .on("end", dragended);
  }

  return (
    <div className="relative w-full h-full bg-slate-950 flex overflow-hidden">
      {/* Canvas Area */}
      <div className="flex-1 relative" ref={containerRef}>
        {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10 bg-slate-950/80">
                <span className="text-accent-500 animate-pulse font-mono">Loading Graph Topology...</span>
            </div>
        )}
        <svg ref={svgRef} className="w-full h-full block" />
        
        {/* Graph Controls Overlay */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
            <button className="p-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors" title="Zoom In">
                <ZoomIn className="w-5 h-5" />
            </button>
            <button className="p-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors" title="Zoom Out">
                <ZoomOut className="w-5 h-5" />
            </button>
            <button className="p-2 bg-slate-800 text-slate-300 rounded-lg border border-slate-700 hover:bg-slate-700 hover:text-white transition-colors" title="Reset Layout" onClick={() => {
                // Ideally this would re-run simulation.alpha(1).restart() via a ref or context
                setData({...data!} as GraphData); // Cheat force re-render
            }}>
                <RefreshCw className="w-5 h-5" />
            </button>
        </div>

        {/* Search Overlay */}
        <div className="absolute top-4 left-4 bg-slate-900/90 backdrop-blur-sm border border-slate-800 rounded-lg p-2 shadow-xl w-72">
            <div className="flex items-center gap-2 px-2 pb-2 border-b border-slate-800 mb-2">
                <Search className="w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search entities..." 
                    className="bg-transparent border-none text-sm text-white focus:outline-none w-full placeholder-slate-500"
                />
            </div>
            <div className="flex gap-1 flex-wrap">
                 {['Person', 'Concept', 'Org', 'Event'].map(type => (
                     <button key={type} className="text-[10px] px-2 py-1 bg-slate-800 rounded text-slate-400 hover:text-white hover:bg-slate-700 border border-slate-700">
                        {type}
                     </button>
                 ))}
            </div>
        </div>
      </div>

      {/* Info Panel Side Sheet */}
      {selectedNode && (
        <div className="w-80 bg-slate-900 border-l border-slate-800 p-6 shadow-2xl z-20 overflow-y-auto animate-in slide-in-from-right duration-200">
           <div className="flex justify-between items-start mb-6">
                <div>
                   <span className="text-xs font-mono text-accent-500 uppercase tracking-widest">{selectedNode.type}</span>
                   <h2 className="text-2xl font-bold text-white mt-1 leading-tight">{selectedNode.label}</h2>
                </div>
                <button onClick={() => setSelectedNode(null)} className="text-slate-500 hover:text-white">✕</button>
           </div>
           
           <div className="space-y-6">
               <div className="bg-slate-950 p-4 rounded-lg border border-slate-800">
                   <h3 className="text-sm font-medium text-slate-300 mb-2">Properties</h3>
                   <div className="space-y-2 text-sm">
                       <div className="flex justify-between border-b border-slate-900 pb-1">
                          <span className="text-slate-500">Degree</span>
                          <span className="text-slate-200 font-mono">{Math.floor(selectedNode.val * 2.5)}</span>
                       </div>
                       <div className="flex justify-between border-b border-slate-900 pb-1">
                          <span className="text-slate-500">Cluster</span>
                          <span className="text-slate-200 font-mono">C-{Math.floor(Math.random()*5)}</span>
                       </div>
                       <div className="flex justify-between">
                          <span className="text-slate-500">Source</span>
                          <span className="text-slate-200 truncate max-w-[120px]">Strategy_2025.pdf</span>
                       </div>
                   </div>
               </div>

               <div>
                   <h3 className="text-sm font-medium text-slate-300 mb-3 flex items-center gap-2">
                       <RefreshCw className="w-3 h-3" /> Related Entities
                   </h3>
                   <div className="flex flex-wrap gap-2">
                       {/* Mock related entities */}
                       {[1,2,3,4].map(i => (
                           <span key={i} className="px-2 py-1 bg-slate-800 rounded border border-slate-700 text-xs text-slate-400 hover:text-white cursor-pointer">
                               Target_Entity_{i}
                           </span>
                       ))}
                   </div>
               </div>

               <button className="w-full py-2 bg-accent-600 hover:bg-accent-500 text-white rounded-lg text-sm font-medium transition-colors">
                   Query This Node
               </button>
           </div>
        </div>
      )}
    </div>
  );
};
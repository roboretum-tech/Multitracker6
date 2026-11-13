import React from 'react';
import { ProjectRisk } from '../types';

interface RAIDHeatmapProps {
  risks: ProjectRisk[];
  selectedRiskId?: string;
  onSelectRisk: (risk: ProjectRisk) => void;
  onFilterCell?: (prob: number, imp: number) => void;
  activeCellFilter?: { prob: number; imp: number } | null;
}

export default function RAIDHeatmap({
  risks,
  selectedRiskId,
  onSelectRisk,
  onFilterCell,
  activeCellFilter,
}: RAIDHeatmapProps) {
  // Grid coordinates: Y = Probability (5 to 1), X = Impact (1 to 5)
  const probabilities = [5, 4, 3, 2, 1];
  const impacts = [1, 2, 3, 4, 5];

  const getCellColor = (prob: number, imp: number, isSelected: boolean) => {
    const score = prob * imp;
    if (isSelected) return 'ring-2 ring-[#0f172a] ring-offset-2 z-10';

    if (score >= 16) {
      return 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-950';
    } else if (score >= 10) {
      return 'bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-950';
    } else if (score >= 5) {
      return 'bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-950';
    }
    return 'bg-emerald-50/60 hover:bg-emerald-50 border-emerald-200/80 text-emerald-950';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 16) return 'bg-rose-600 text-white';
    if (score >= 10) return 'bg-amber-600 text-white';
    if (score >= 5) return 'bg-blue-600 text-white';
    return 'bg-emerald-600 text-white';
  };

  return (
    <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Matriz CSEA v4.0 (5×5)</span>
          <h3 className="text-sm font-bold text-slate-900">Mapa de Calor: Probabilidad vs. Severidad de Impacto</h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-emerald-500" />
            <span>Bajo (1-4)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-blue-500" />
            <span>Medio (5-9)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-amber-500" />
            <span>Alto (10-15)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-rose-600" />
            <span>Crítico (16-25)</span>
          </div>
        </div>
      </div>

      <div className="relative overflow-x-auto">
        <div className="min-w-[480px]">
          {/* Main Matrix Grid */}
          <div className="grid grid-cols-[80px_repeat(5,1fr)] gap-1.5">
            {/* Corner label */}
            <div className="flex items-end justify-center pb-1 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
              Probabilidad
            </div>
            {/* Impact headers */}
            {impacts.map(imp => (
              <div key={`head-${imp}`} className="text-center pb-1">
                <div className="text-[10px] font-bold text-slate-700">Impacto {imp}</div>
                <div className="text-[9px] text-slate-400">
                  {imp === 1 ? 'Menor' : imp === 3 ? 'Moderado' : imp === 5 ? 'Catastrófico' : ''}
                </div>
              </div>
            ))}

            {/* Matrix rows */}
            {probabilities.map(prob => (
              <React.Fragment key={`row-${prob}`}>
                {/* Y-axis label */}
                <div className="flex items-center justify-between pr-2 text-[11px] font-semibold text-slate-700">
                  <span>P{prob}</span>
                  <span className="text-[9px] text-slate-400">
                    {prob === 5 ? 'Muy alta' : prob === 3 ? 'Media' : prob === 1 ? 'Muy baja' : ''}
                  </span>
                </div>

                {/* 5 columns of cells */}
                {impacts.map(imp => {
                  const cellRisks = risks.filter(r => r.probability === prob && r.impact === imp);
                  const isCellActive = activeCellFilter?.prob === prob && activeCellFilter?.imp === imp;
                  const cellColor = getCellColor(prob, imp, isCellActive);

                  return (
                    <div
                      key={`cell-${prob}-${imp}`}
                      onClick={() => onFilterCell && onFilterCell(prob, imp)}
                      className={`min-h-[72px] p-2 rounded-lg border transition-all flex flex-col justify-between cursor-pointer ${cellColor}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-400">P{prob}×I{imp}</span>
                        <span className={`text-[9px] font-bold px-1 rounded-xs ${getScoreBadge(prob * imp)}`}>
                          {prob * imp}
                        </span>
                      </div>

                      <div className="flex flex-wrap gap-1 mt-1">
                        {cellRisks.map(r => {
                          const isSelected = selectedRiskId === r.id;
                          return (
                            <button
                              key={r.id}
                              onClick={(e) => {
                                e.stopPropagation();
                                onSelectRisk(r);
                              }}
                              title={`[${r.code}] ${r.title} (${r.status})`}
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-transform ${
                                isSelected
                                  ? 'bg-[#0f172a] text-white ring-2 ring-orange-500 scale-105'
                                  : r.severity_level === 'Crítico'
                                  ? 'bg-rose-700 text-white hover:bg-rose-800'
                                  : r.severity_level === 'Alto'
                                  ? 'bg-amber-700 text-white hover:bg-amber-800'
                                  : 'bg-slate-700 text-white hover:bg-slate-800'
                              }`}
                            >
                              {r.code}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>

          {activeCellFilter && (
            <div className="mt-3 flex items-center justify-between bg-slate-100 px-3 py-1.5 rounded-lg text-xs">
              <span className="font-medium text-slate-700">
                Filtrando por celda: <strong>Probabilidad {activeCellFilter.prob} × Impacto {activeCellFilter.imp}</strong> ({risks.filter(r => r.probability === activeCellFilter.prob && r.impact === activeCellFilter.imp).length} riesgos)
              </span>
              <button
                onClick={() => onFilterCell && onFilterCell(0, 0)}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 cursor-pointer"
              >
                Limpiar filtro
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

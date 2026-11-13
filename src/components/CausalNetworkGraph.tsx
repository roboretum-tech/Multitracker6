import React, { useState } from 'react';
import { CausalChainBundle } from '../utils/causalNetwork';
import { 
  ShieldCheck, 
  FileText, 
  CheckSquare, 
  AlertTriangle, 
  ArrowRight, 
  Clock, 
  GitFork, 
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

interface CausalNetworkGraphProps {
  chains: CausalChainBundle[];
  onSelectProject?: (projectId: string) => void;
  onOpenDecisionModal?: (decision: any) => void;
  onOpenAgreementModal?: (agreement: any) => void;
  onOpenRiskModal?: (risk: any) => void;
}

export default function CausalNetworkGraph({
  chains,
  onSelectProject,
  onOpenDecisionModal,
  onOpenAgreementModal,
  onOpenRiskModal,
}: CausalNetworkGraphProps) {
  const [expandedChainId, setExpandedChainId] = useState<string | null>(chains[0]?.id || null);

  if (chains.length === 0) {
    return (
      <div className="bg-white p-8 rounded-xl border border-slate-200 text-center">
        <GitFork className="w-8 h-8 text-slate-400 mx-auto mb-2" />
        <h4 className="text-sm font-bold text-slate-800">Sin cadenas causales vinculadas</h4>
        <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
          Para visualizar la red causal CSEA v4.0, vincule decisiones y acuerdos a entregables del cronograma o riesgos de portafolio.
        </p>
      </div>
    );
  }

  const getThreatBadge = (threatLevel: CausalChainBundle['threatLevel']) => {
    switch (threatLevel) {
      case 'CRITICAL':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          dot: 'bg-rose-600',
          label: 'Amenaza Crítica a Hito',
        };
      case 'WARNING':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          dot: 'bg-amber-500',
          label: 'Alerta de Gobernanza',
        };
      case 'HEALTHY':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          dot: 'bg-emerald-600',
          label: 'Cadena Estabilizada',
        };
      default:
        return {
          bg: 'bg-slate-50 border-slate-200 text-slate-700',
          dot: 'bg-slate-400',
          label: 'Monitoreo Ordinario',
        };
    }
  };

  return (
    <div className="space-y-3">
      {chains.map((chain) => {
        const isExpanded = expandedChainId === chain.id;
        const threatBadge = getThreatBadge(chain.threatLevel);

        return (
          <div
            key={chain.id}
            className={`bg-white rounded-xl border transition-all overflow-hidden ${
              chain.threatLevel === 'CRITICAL'
                ? 'border-rose-300 shadow-xs'
                : chain.threatLevel === 'WARNING'
                ? 'border-amber-300 shadow-xs'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            {/* Header / Summary Bar */}
            <div
              onClick={() => setExpandedChainId(isExpanded ? null : chain.id)}
              className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-slate-50/70 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg shrink-0 ${
                  chain.threatLevel === 'CRITICAL' ? 'bg-rose-100 text-rose-700' :
                  chain.threatLevel === 'WARNING' ? 'bg-amber-100 text-amber-800' :
                  'bg-slate-100 text-slate-700'
                }`}>
                  <GitFork className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-bold text-slate-900">{chain.projectName}</span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1.5 ${threatBadge.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${threatBadge.dot}`} />
                      {threatBadge.label}
                    </span>
                    {chain.isCriticalTask && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                        Ruta Crítica (Holgura 0d)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1 line-clamp-1 font-medium">
                    {chain.causalNarrative}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 self-end md:self-auto shrink-0">
                {chain.isThreateningMilestone && (
                  <span className="text-[11px] font-bold text-rose-600 flex items-center gap-1 bg-rose-50 px-2.5 py-1 rounded-md border border-rose-200">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Impacto directo en fecha fin
                  </span>
                )}
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-slate-400" />
                )}
              </div>
            </div>

            {/* Expanded Detailed Causal Flow */}
            {isExpanded && (
              <div className="p-5 pt-0 border-t border-slate-100 bg-slate-50/50 space-y-4">
                {/* Visual Flow diagram: 4 stages */}
                <div className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-3 relative">
                  {/* Step 1: Decision (GOB) */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs relative">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-orange-600 mb-1.5">
                      <span className="flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        Gobernanza (GOB)
                      </span>
                      {chain.decision && <span>{chain.decision.code}</span>}
                    </div>
                    {chain.decision ? (
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 leading-snug">{chain.decision.title}</h5>
                        <div className="mt-2 flex items-center justify-between text-[11px] text-slate-500">
                          <span>{chain.decision.decision_maker}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                            chain.decision.status === 'Aprobada' ? 'bg-emerald-100 text-emerald-800' :
                            chain.decision.status === 'Rechazada' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {chain.decision.status}
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic py-2">Sin decisión formal vinculada</div>
                    )}
                  </div>

                  {/* Step 2: Agreements (DIS) */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-emerald-600 mb-1.5">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5" />
                        Disciplina (DIS)
                      </span>
                      <span>{chain.agreements.length} Acuerdo(s)</span>
                    </div>
                    {chain.agreements.length > 0 ? (
                      <div className="space-y-1.5">
                        {chain.agreements.map(a => (
                          <div key={a.id} className="p-1.5 rounded bg-slate-50 border border-slate-100 text-xs">
                            <div className="flex items-center justify-between font-semibold text-slate-800">
                              <span className="font-mono text-[10px] text-slate-500">{a.code}</span>
                              <span className={`text-[9px] font-bold px-1 rounded ${
                                a.status === 'Cumplido' ? 'bg-emerald-100 text-emerald-800' :
                                a.status === 'Atrasado' ? 'bg-rose-100 text-rose-800' :
                                'bg-amber-100 text-amber-800'
                              }`}>
                                {a.status}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{a.description}</p>
                            <div className="text-[10px] text-slate-400 mt-0.5 flex justify-between">
                              <span>{a.responsible_name}</span>
                              <span>Vence: {a.due_date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic py-2">Sin acuerdos registrados</div>
                    )}
                  </div>

                  {/* Step 3: Schedule & Critical Path Task */}
                  <div className={`bg-white p-3.5 rounded-lg border shadow-2xs ${
                    chain.isCriticalTask ? 'border-rose-200 ring-1 ring-rose-300/50' : 'border-slate-200'
                  }`}>
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-blue-600 mb-1.5">
                      <span className="flex items-center gap-1">
                        <CheckSquare className="w-3.5 h-3.5" />
                        Entregable
                      </span>
                      <span>{chain.isCriticalTask ? 'Ruta Crítica' : `Holgura: ${chain.taskSlackDays}d`}</span>
                    </div>
                    {chain.task ? (
                      <div>
                        <h5 className="text-xs font-bold text-slate-900 leading-snug">{chain.task.name}</h5>
                        <div className="mt-2 space-y-1 text-[11px] text-slate-500">
                          <div className="flex justify-between">
                            <span>Fechas:</span>
                            <span className="font-medium text-slate-700">{chain.task.start_date || 'N/A'} al {chain.task.end_date || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Estado:</span>
                            <span className="font-semibold text-slate-800">{chain.task.status || 'En curso'}</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic py-2">Sin entregable vinculado</div>
                    )}
                  </div>

                  {/* Step 4: Risk Mitigation (DIS/VIS) */}
                  <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-2xs">
                    <div className="flex items-center justify-between text-[10px] uppercase font-bold text-rose-600 mb-1.5">
                      <span className="flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Riesgos (Sección 8)
                      </span>
                      <span>{chain.risks.length} Riesgo(s)</span>
                    </div>
                    {chain.risks.length > 0 ? (
                      <div className="space-y-1.5">
                        {chain.risks.map(r => (
                          <div key={r.id} className="p-1.5 rounded bg-slate-50 border border-slate-100 text-xs">
                            <div className="flex items-center justify-between font-semibold text-slate-800">
                              <span className="font-mono text-[10px] text-slate-500">{r.code}</span>
                              <span className={`text-[9px] font-bold px-1 rounded ${
                                r.severity_level === 'Crítico' ? 'bg-rose-600 text-white' :
                                r.severity_level === 'Alto' ? 'bg-amber-600 text-white' :
                                'bg-blue-600 text-white'
                              }`}>
                                {r.severity_level} ({r.severity_score})
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">{r.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5">Mitiga: {r.mitigation_owner}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-400 italic py-2">Sin riesgos identificados</div>
                    )}
                  </div>
                </div>

                {/* Consultive Recommendation Card (CSEA v4.0 Style) */}
                <div className="p-3.5 bg-white rounded-lg border border-slate-200 flex items-start gap-3 text-xs">
                  <div className="p-1.5 bg-[#0f172a] text-orange-500 rounded shrink-0 mt-0.5">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">Recomendación de Dirección Consultiva (CSEA v4.0):</div>
                    <p className="text-slate-600 mt-0.5">{chain.governanceRecommendation}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

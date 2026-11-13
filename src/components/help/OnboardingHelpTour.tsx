/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  ExternalLink, 
  Sparkles, 
  CheckCircle2, 
  BookOpen, 
  RotateCcw,
  Minimize2,
  Maximize2,
  HelpCircle,
  LayoutDashboard,
  FilePlus2,
  BarChart3,
  Calendar,
  Network,
  Users
} from 'lucide-react';

export interface TourStep {
  id: string;
  viewId: string;
  title: string;
  subtitle: string;
  description: string;
  executiveValue: string;
  icon: React.ElementType;
  keyActions: string[];
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'dashboard',
    viewId: 'dashboard',
    title: '1. Torre de Control & Dashboard Ejecutivo',
    subtitle: 'Supervisión consolidada y diagnóstico en tiempo real',
    description: 'Centraliza el estado de salud del portafolio en una sola vista. Integra semáforos de desviación, métricas consolidadas de avance y la Torre de Atención prioritaria para identificar desvíos antes de que afecten los plazos de entrega.',
    executiveValue: 'Facilita la visibilidad ejecutiva (Dimensión VIS) y anticipa exposiciones críticas en la toma de decisiones C-Level.',
    icon: LayoutDashboard,
    keyActions: [
      'Visualizar la distribución global de proyectos y semáforos de riesgo.',
      'Revisar la Torre de Atención para tareas con retraso o bloqueo.',
      'Acceder rápidamente a indicadores clave de desempeño (KPIs).'
    ]
  },
  {
    id: 'data-entry',
    viewId: 'data-entry',
    title: '2. Captura de Datos & Facturación',
    subtitle: 'Registro ágil de proyectos, tareas y control financiero',
    description: 'Punto de entrada unificado para registrar iniciativas, actualizar el avance de entregables y registrar órdenes de facturación y cobranza por cliente, eliminando la dispersión de información.',
    executiveValue: 'Estandariza la disciplina de captura (Dimensión DIS) y mantiene la trazabilidad financiera del portafolio.',
    icon: FilePlus2,
    keyActions: [
      'Dar de alta proyectos con fechas objetivo, presupuesto y líder.',
      'Crear entregables vinculados con responsables y fechas límite.',
      'Registrar facturas emitidas y monitorear el estado de cobranza.'
    ]
  },
  {
    id: 'analytics',
    viewId: 'analytics',
    title: '3. Ritmo de Entrega & Burndown (Velocidad)',
    subtitle: 'Monitoreo de tareas restantes y proyección de finalización',
    description: 'Contrasta la curva de quemado ideal con el avance real diario de tu equipo. Utiliza la proyección inteligente de velocidad para anticipar con precisión la fecha estimada de cierre y alertar sobre retrasos de forma oportuna.',
    executiveValue: 'Facilita la negociación objetiva de plazos y compromisos con patrocinadores y clientes basándose en el ritmo real observado.',
    icon: BarChart3,
    keyActions: [
      'Comparar la trayectoria de avance real frente a la línea ideal.',
      'Generar bajo demanda el pronóstico de fecha de término del proyecto.',
      'Evaluar la velocidad diaria y la distribución porcentual del esfuerzo.'
    ]
  },
  {
    id: 'gantt',
    viewId: 'gantt',
    title: '4. Cronograma, Gantt & Ruta Crítica',
    subtitle: 'Secuenciación temporal, dependencias y control de holguras',
    description: 'Vista de cronograma interactivo que mapea las relaciones de precedencia entre tareas. Identifica la ruta crítica del proyecto y las actividades con holgura cero que condicionan la fecha de finalización.',
    executiveValue: 'Permite intervenir oportunamente en los cuellos de botella que representan riesgo directo para el cumplimiento de hitos.',
    icon: Calendar,
    keyActions: [
      'Inspeccionar la secuencia cronológica de fases y entregables.',
      'Identificar la ruta crítica resaltada y las dependencias de tareas.',
      'Contrastar el cronograma actual contra la línea base aprobada.'
    ]
  },
  {
    id: 'raid',
    viewId: 'raid',
    title: '5. Matriz RAID & Red Causal',
    subtitle: 'Gestión proactiva de Riesgos, Suposiciones, Incidencias y Dependencias',
    description: 'Módulo estructurado para catalogar y valorar amenazas antes de su materialización. Incluye matriz de calor por probabilidad e impacto y un grafo causal para visualizar cómo un riesgo inicial se propaga hacia otros entregables.',
    executiveValue: 'Fortalece la gobernanza preventiva (Dimensión GOB) y mitiga la exposición a desviaciones severas.',
    icon: Network,
    keyActions: [
      'Documentar riesgos con planes de mitigación y responsable asignado.',
      'Analizar la matriz de calor para priorizar exposiciones severas.',
      'Explorar la red causal de dependencias entre incidencias.'
    ]
  },
  {
    id: 'tasks-team',
    viewId: 'tasks',
    title: '6. Tareas, Entregables & Matriz RACI',
    subtitle: 'Claridad en roles, responsabilidades y flujo de trabajo',
    description: 'Gestión granular de actividades a través de listas de verificación y tablero Kanban interactivo. En conjunto con la Matriz RACI, define quién es Responsable (R), Aprobador (A), Consultado (C) o Informado (I) en cada hito.',
    executiveValue: 'Elimina ambigüedades operativas y asegura rendición de cuentas en todos los niveles del equipo (Dimensión CAP).',
    icon: Users,
    keyActions: [
      'Mover tarjetas entre estados: Pendiente, En Proceso, Revisión y Completada.',
      'Verificar asignaciones RACI para evitar tareas sin dueño o con doble liderazgo.',
      'Filtrar por responsable, prioridad y proyecto para balancear la carga de trabajo.'
    ]
  }
];

interface OnboardingHelpTourProps {
  currentView: string;
  onNavigate: (viewId: string) => void;
  onOpenReferenceManual: () => void;
}

export const OnboardingHelpTour: React.FC<OnboardingHelpTourProps> = ({
  currentView,
  onNavigate,
  onOpenReferenceManual
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);

  // Check if first-time user on mount & listen to explicit tour open events
  useEffect(() => {
    const tourStatus = localStorage.getItem('csea_onboarding_completed');
    if (!tourStatus) {
      // Small delay to let the initial layout mount gracefully
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 800);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    const handleOpenTourEvent = () => {
      setCurrentStepIndex(0);
      setIsOpen(true);
      setIsMinimized(false);
      onNavigate(TOUR_STEPS[0].viewId);
    };
    window.addEventListener('csea_open_tour', handleOpenTourEvent);
    return () => window.removeEventListener('csea_open_tour', handleOpenTourEvent);
  }, [onNavigate]);

  const currentStep = TOUR_STEPS[currentStepIndex];

  const handleNext = () => {
    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      // Seamlessly navigate to the step's view
      onNavigate(TOUR_STEPS[nextIndex].viewId);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStepIndex > 0) {
      const prevIndex = currentStepIndex - 1;
      setCurrentStepIndex(prevIndex);
      onNavigate(TOUR_STEPS[prevIndex].viewId);
    }
  };

  const handleGoToStep = (index: number) => {
    setCurrentStepIndex(index);
    onNavigate(TOUR_STEPS[index].viewId);
  };

  const handleComplete = () => {
    localStorage.setItem('csea_onboarding_completed', 'true');
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleDismiss = () => {
    localStorage.setItem('csea_onboarding_completed', 'true');
    setIsOpen(false);
    setIsMinimized(false);
  };

  const handleRestartTour = () => {
    setCurrentStepIndex(0);
    setIsOpen(true);
    setIsMinimized(false);
    onNavigate(TOUR_STEPS[0].viewId);
  };

  const IconComponent = currentStep.icon;

  return (
    <>
      {/* Floating launcher trigger (Always available in bottom-right corner) */}
      <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 print:hidden">
        <button
          onClick={onOpenReferenceManual}
          title="Consultar Manual de Referencia CSEA v4.0"
          className="flex items-center gap-2 px-3 py-2 bg-white text-slate-700 hover:text-slate-900 border border-slate-200 rounded-lg shadow-md hover:shadow-lg transition-all text-xs font-semibold"
        >
          <BookOpen className="w-3.5 h-3.5 text-orange-600" />
          <span className="hidden sm:inline">Manual CSEA v4.0</span>
        </button>

        <button
          onClick={() => {
            if (isOpen && isMinimized) {
              setIsMinimized(false);
            } else if (!isOpen) {
              handleRestartTour();
            } else {
              setIsMinimized(prev => !prev);
            }
          }}
          className="flex items-center gap-2 px-3.5 py-2 bg-[#0f172a] text-white hover:bg-slate-800 rounded-lg shadow-lg hover:shadow-xl transition-all border border-slate-700 text-xs font-semibold group"
          title="Guía de Inducción Interactiva"
        >
          <Compass className="w-4 h-4 text-orange-400 group-hover:rotate-45 transition-transform" />
          <span className="font-bold">Guía Interactiva</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </button>
      </div>

      {/* Floating Guide Modal / Card */}
      {isOpen && (
        <div className="fixed bottom-20 right-5 z-40 w-full max-w-[440px] print:hidden animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 overflow-hidden flex flex-col">
            {/* Card Header */}
            <div className="bg-[#0f172a] text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center border border-orange-500/30">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
                    Inducción CSEA v4.0
                    <span className="text-[10px] text-slate-400 font-normal font-mono">
                      (Paso {currentStepIndex + 1}/{TOUR_STEPS.length})
                    </span>
                  </h4>
                  <p className="text-[10px] text-slate-400">Metodología Capricorn Consulting</p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                  title={isMinimized ? "Expandir" : "Minimizar"}
                >
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5" /> : <Minimize2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={handleDismiss}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                  title="Cerrar guía"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Minimized View Bar */}
            {isMinimized ? (
              <div className="p-3 bg-slate-50 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <IconComponent className="w-4 h-4 text-orange-600" />
                  <span className="text-xs font-bold text-slate-800 truncate max-w-[240px]">
                    {currentStep.title}
                  </span>
                </div>
                <button
                  onClick={() => setIsMinimized(false)}
                  className="text-xs text-orange-600 hover:text-orange-700 font-bold"
                >
                  Expandir
                </button>
              </div>
            ) : (
              /* Expanded Content */
              <div className="p-4 flex flex-col space-y-3.5 max-h-[75vh] overflow-y-auto">
                {/* Step Progress Indicator Bar */}
                <div className="flex items-center gap-1.5 w-full">
                  {TOUR_STEPS.map((step, idx) => (
                    <button
                      key={step.id}
                      onClick={() => handleGoToStep(idx)}
                      className={`h-1.5 flex-1 rounded-full transition-all ${
                        idx === currentStepIndex
                          ? 'bg-orange-500 ring-2 ring-orange-200'
                          : idx < currentStepIndex
                          ? 'bg-slate-700'
                          : 'bg-slate-200 hover:bg-slate-300'
                      }`}
                      title={step.title}
                    />
                  ))}
                </div>

                {/* Step Title & Subtitle */}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="p-1 rounded bg-orange-100 text-orange-700">
                      <IconComponent className="w-4 h-4" />
                    </span>
                    <h5 className="text-sm font-bold text-slate-900 leading-snug">
                      {currentStep.title}
                    </h5>
                  </div>
                  <p className="text-xs font-medium text-slate-500">
                    {currentStep.subtitle}
                  </p>
                </div>

                {/* Step Description */}
                <p className="text-xs text-slate-700 leading-relaxed bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  {currentStep.description}
                </p>

                {/* Key Executive Value / Dimension alignment */}
                <div className="bg-orange-50/70 border border-orange-200 rounded-lg p-2.5">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="text-[10px] font-bold text-orange-900 uppercase tracking-wider block">
                        Aporte Metodológico CSEA
                      </span>
                      <p className="text-xs text-orange-950 font-medium leading-relaxed">
                        {currentStep.executiveValue}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Actions Checklist */}
                <div>
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block mb-1.5">
                    Acciones operativas recomendadas
                  </span>
                  <ul className="space-y-1.5">
                    {currentStep.keyActions.map((action, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="leading-snug">{action}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Navigate directly to module button if not currently there */}
                {currentView !== currentStep.viewId && (
                  <button
                    onClick={() => onNavigate(currentStep.viewId)}
                    className="w-full flex items-center justify-center gap-2 py-1.5 px-3 rounded-lg border border-slate-300 hover:border-slate-400 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-800 transition-colors shadow-sm"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-orange-600" />
                    <span>Navegar a la pantalla de este módulo</span>
                  </button>
                )}

                {/* Navigation and Completion Controls */}
                <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
                  <button
                    onClick={handleDismiss}
                    className="text-xs text-slate-500 hover:text-slate-700 font-medium transition-colors"
                  >
                    Omitir recorrido
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handlePrev}
                      disabled={currentStepIndex === 0}
                      className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      Anterior
                    </button>

                    <button
                      onClick={handleNext}
                      className="px-3 py-1.5 bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
                    >
                      <span>{currentStepIndex === TOUR_STEPS.length - 1 ? 'Finalizar' : 'Siguiente'}</span>
                      {currentStepIndex === TOUR_STEPS.length - 1 ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Link to full CSEA Reference Manual */}
                <div className="pt-1 text-center">
                  <button
                    onClick={() => {
                      onOpenReferenceManual();
                      setIsMinimized(true);
                    }}
                    className="text-[11px] font-semibold text-orange-700 hover:text-orange-800 underline flex items-center justify-center gap-1 mx-auto"
                  >
                    <BookOpen className="w-3 h-3" />
                    Abrir el Manual de Referencia CSEA v4.0 Completo
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

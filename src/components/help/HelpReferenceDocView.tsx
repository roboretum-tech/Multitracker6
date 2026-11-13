/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  Printer,
  Compass,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Calendar,
  Network,
  Users,
  CreditCard,
  LayoutDashboard,
  FilePlus2,
  ChevronRight,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Clock,
  Flag,
  Target,
  HelpCircle,
  Lightbulb,
  CheckSquare,
  FolderKanban,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';

interface HelpReferenceDocViewProps {
  onStartTour: () => void;
  onNavigateToView: (viewId: string) => void;
}

export const HelpReferenceDocView: React.FC<HelpReferenceDocViewProps> = ({
  onStartTour,
  onNavigateToView
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'workflows' | 'glossary' | 'best-practices' | 'faq'>('workflows');
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const handleCopySection = (sectionId: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(sectionId);
    setTimeout(() => setCopiedSection(null), 2500);
  };

  // Day-to-day PM Workflows
  const pmWorkflows = [
    {
      id: 'step-1',
      number: '01',
      title: 'Planificación y Apertura de una Iniciativa',
      tagline: 'Cómo dar de alta un proyecto, categorizarlo y fijar sus metas',
      targetView: 'data-entry',
      viewLabel: 'Abrir Captura de Proyectos',
      secondaryView: 'projects',
      secondaryLabel: 'Ver Base de Proyectos',
      objective: 'Establecer los cimientos del proyecto definiendo su alcance, fechas contractuales, presupuesto estimado y su área estratégica de negocio.',
      actionSteps: [
        'Ve a "Captura de Datos" y selecciona la pestaña "Nuevo Proyecto".',
        'Ingresa el nombre claro del proyecto. Si necesitas una nueva categoría o área de negocio (ej. "Logística", "Transformación"), pulsa en "+ Nueva categoría" y escríbela.',
        'Asigna la fecha estimada de inicio y la fecha límite (Deadline) pactada.',
        'Ingresa el presupuesto o valor estimado del proyecto en moneda (USD).',
        'Haz clic en "Guardar Proyecto". La iniciativa quedará inmediatamente disponible en todo el sistema.'
      ],
      pmTip: 'Una vez creado el proyecto, establece su Línea Base en el módulo de "Línea Base & Ruta Crítica". La Línea Base es tu fotografía oficial aprobada para comparar cualquier variación futura.',
      deliverables: ['Ficha de proyecto registrada', 'Presupuesto base asignado', 'Línea de tiempo inicial establecida']
    },
    {
      id: 'step-2',
      number: '02',
      title: 'Asignación de Roles y Matriz RACI',
      tagline: 'Cómo eliminar la ambigüedad y clarificar la rendición de cuentas',
      targetView: 'team',
      viewLabel: 'Ver Equipo & Matriz RACI',
      secondaryView: 'data-entry',
      secondaryLabel: 'Asignar Roles en Proyecto',
      objective: 'Garantizar que cada proyecto y tarea tenga un único responsable directo de ejecución y un único aprobador, evitando tareas huérfanas o duplicidad de esfuerzos.',
      actionSteps: [
        'Ingresa a "Equipo & Matriz RACI" para revisar la capacidad y roles de los consultores.',
        'Al dar de alta o editar un proyecto, asigna formalmente los 4 roles clave: Responsible (R - quien ejecuta), Accountable (A - quien aprueba el entregable), Consulted (C - experto que aporta criterio) e Informed (I - a quien se notifica del avance).',
        'Revisa el balance de carga en la matriz para asegurarte de que ningún consultor esté saturado con más proyectos críticos de los que puede atender.',
        'Verifica que todas las tareas clave cuenten con un dueño asignado.'
      ],
      pmTip: 'Regla de oro de gestión: Un entregable puede tener varios colaboradores (R), pero NUNCA debe tener más de un aprobador (A). La responsabilidad final nunca debe compartirse para evitar dilución en la toma de decisiones.',
      deliverables: ['Matriz de responsabilidades clara', 'Aprobadores identificados por entregable', 'Carga de trabajo balanceada']
    },
    {
      id: 'step-3',
      number: '03',
      title: 'Seguimiento Diario, Kanban y Avance de Entregables',
      tagline: 'Cómo coordinar el trabajo del día y mantener el flujo ágil',
      targetView: 'kanban',
      viewLabel: 'Ir al Tablero Kanban',
      secondaryView: 'tasks',
      secondaryLabel: 'Ver Lista de Entregables',
      objective: 'Monitorear la ejecución diaria de los compromisos adquiridos y detectar bloqueos antes de que impacten la fecha del hito.',
      actionSteps: [
        'Abre el "Tablero Kanban" para tener una vista visual de tarjetas por columnas (No iniciado, En curso, En espera, Completado).',
        'Arrastra las tarjetas a medida que el equipo avance en su desarrollo.',
        'Si una tarea se detiene por falta de información externa, muévela a "En espera" y documenta la causa en las notas de la tarea.',
        'Al completar una tarea, el sistema recalculará automáticamente el porcentaje de avance físico acumulado del proyecto.'
      ],
      pmTip: 'Dedica 10 minutos al inicio de la jornada a revisar la columna "En curso". Si una tarea pasa más de 3 días sin registrar progreso, organice una sesión breve de desbloqueo con el responsable asignado.',
      deliverables: ['Flujo de trabajo visible', 'Porcentajes de avance actualizados en tiempo real', 'Bloqueos identificados a tiempo']
    },
    {
      id: 'step-4',
      number: '04',
      title: 'Monitoreo del Ritmo y Burndown (Velocidad de Cierre)',
      tagline: 'Cómo saber con certeza objetiva si el proyecto llegará a tiempo',
      targetView: 'analytics',
      viewLabel: 'Ver Analíticas & Burndown',
      secondaryView: 'dashboard',
      secondaryLabel: 'Ir a Torre de Control',
      objective: 'Evaluar si la velocidad de entrega del equipo es suficiente para cumplir con la fecha comprometida o si se requiere un ajuste oportuno de alcance o capacidad.',
      actionSteps: [
        'Abre el módulo "Analíticas & Burndown" y selecciona el proyecto que deseas analizar.',
        'Observa el gráfico de quemado (Burndown): la línea punteada gris muestra la trayectoria ideal teórica de cierre, mientras que la curva naranja muestra el ritmo real de tareas restantes.',
        'Haz clic en "Generar Pronóstico con IA" para obtener una estimación objetiva de la fecha probable de finalización basada en la velocidad demostrada en los últimos días.',
        'Consulta el reporte ejecutivo adjunto para conocer si la velocidad actual es suficiente o si existe riesgo de deslizamiento.'
      ],
      pmTip: 'Si la curva real está por encima de la línea ideal, significa que el equipo está acumulando trabajo pendiente a un ritmo más lento del necesario. Es el momento de priorizar entregables "Must Have" y diferir los "Nice to Have".',
      deliverables: ['Velocidad real de entrega calculada', 'Fecha proyectada de cierre sin sesgos optimistas', 'Alertas tempranas de desviación']
    },
    {
      id: 'step-5',
      number: '05',
      title: 'Cronograma, Gantt y Control de Ruta Crítica',
      tagline: 'Cómo identificar las tareas que no admiten un solo día de retraso',
      targetView: 'gantt',
      viewLabel: 'Abrir Cronograma & Gantt',
      secondaryView: 'baseline',
      secondaryLabel: 'Comparar con Línea Base',
      objective: 'Supervisar la secuencia lógica de entregables y proteger las tareas críticas que condicionan la fecha de entrega final.',
      actionSteps: [
        'Ingresa a "Cronograma & Gantt" para visualizar el diagrama de barras temporales.',
        'Localiza las barras marcadas como "Ruta Crítica": estas actividades tienen holgura cero. Cualquier día que se retrase una tarea crítica, la fecha de cierre de todo el proyecto se retrasará exactamente un día.',
        'Verifica las flechas de precedencia entre tareas dependientes para asegurarte de que ningún entregable sucesor comience antes de concluir su predecesor.',
        'Accede a "Línea Base & Ruta Crítica" para comparar visualmente el cronograma original aprobado frente a la situación real vigente.'
      ],
      pmTip: 'Protege siempre los recursos asignados a las tareas de la ruta crítica. Si un imprevisto exige reasignar personal, nunca retires consultores de actividades que pertenezcan a la ruta crítica.',
      deliverables: ['Ruta crítica identificada visualmente', 'Dependencias lógicas aseguradas', 'Cálculo de holguras positivas y negativas']
    },
    {
      id: 'step-6',
      number: '06',
      title: 'Gestión Proactiva de Riesgos e Incidencias (Matriz RAID)',
      tagline: 'Cómo anticipar amenazas antes de que se conviertan en crisis',
      targetView: 'raid',
      viewLabel: 'Explorar Matriz RAID',
      secondaryView: 'dashboard',
      secondaryLabel: 'Revisar Torre de Atención',
      objective: 'Registrar, categorizar y mitigar Riesgos, Suposiciones, Incidencias y Dependencias para proteger el margen y los plazos del proyecto.',
      actionSteps: [
        'Abre la "Matriz RAID & Red Causal".',
        'Registra nuevos riesgos especificando su probabilidad (1 a 5) y su impacto estimado (1 a 5).',
        'Asigna un responsable obligatorio y describe un plan de mitigación concreto (qué se hará para evitar que ocurra).',
        'Si un riesgo llega a materializarse, cámbialo a estado "Incidencia" (Issue) para que se eleve de inmediato a la Torre de Atención prioritaria.',
        'Revisa la red causal para entender qué otros entregables se verían afectados si una dependencia externa falla.'
      ],
      pmTip: 'Diferencia fundamental: Un "Riesgo" es un evento futuro e incierto que aún se puede evitar; una "Incidencia" es un hecho que ya está ocurriendo en el presente y exige contención inmediata.',
      deliverables: ['Matriz de calor actualizada', 'Planes de mitigación asignados', 'Escalación oportuna en la Torre de Atención']
    },
    {
      id: 'step-7',
      number: '07',
      title: 'Comités de Dirección, Minutas y Facturación',
      tagline: 'Cómo reportar resultados ejecutivos y conciliar cobranzas',
      targetView: 'dashboard',
      viewLabel: 'Ver Dashboard Ejecutivo',
      secondaryView: 'invoices',
      secondaryLabel: 'Facturación & Cobranza',
      objective: 'Preparar reuniones con patrocinadores en minutos y garantizar que cada entregable validado se traduzca oportunamente en facturación y cobranza.',
      actionSteps: [
        'Abre el "Dashboard Ejecutivo" para revisar el semáforo global del portafolio antes de entrar a un comité directivo.',
        'En "Comunicaciones & Minutas", registra la bitácora de acuerdos, compromisos adquiridos y cambios de alcance formalmente aprobados.',
        'En "Facturación & Cobranza", vincula las órdenes de cobro con los hitos contractuales aprobados por el cliente.',
        'Monitorea las facturas vencidas o en espera de pago para proteger el flujo de caja del proyecto.'
      ],
      pmTip: 'No llegues a un comité con hojas de cálculo dispersas. Utiliza las tarjetas de KPIs del Dashboard Ejecutivo y el gráfico de Burndown para presentar datos verídicos y auditables en una sola pantalla.',
      deliverables: ['Minuta formal con acuerdos firmados', 'Hitos facturados y conciliados', 'Reporte C-Level en una sola pantalla']
    }
  ];

  // PM Glossary
  const pmGlossary = [
    {
      term: 'Línea Base (Baseline)',
      meaning: 'Es la versión formalmente aprobada del cronograma, alcance y presupuesto antes de iniciar la ejecución. Sirve como fotografía histórica inmutable para medir con precisión las desviaciones en días o costos a lo largo del tiempo.'
    },
    {
      term: 'Ruta Crítica (Critical Path)',
      meaning: 'Es la secuencia más larga de tareas dependientes que determina la duración total mínima del proyecto. Las tareas en la ruta crítica tienen "holgura cero": cualquier atraso en una de ellas atrasa directamente la entrega final.'
    },
    {
      term: 'Holgura (Float / Slack)',
      meaning: 'Es el margen de tiempo que una tarea puede retrasarse sin afectar la fecha final del proyecto ni la fecha de inicio de sus tareas sucesoras. Una holgura negativa indica que el proyecto ya se encuentra retrasado respecto a su meta.'
    },
    {
      term: 'Burndown Chart (Gráfico de Quemado)',
      meaning: 'Gráfico visual que muestra la cantidad de tareas o trabajo pendiente a lo largo del tiempo. Permite contrastar la velocidad real del equipo con el ritmo teórico necesario para culminar en la fecha objetivo.'
    },
    {
      term: 'Velocidad del Equipo',
      meaning: 'Es el promedio de tareas o entregables que el equipo de consultoría completa efectivamente por unidad de tiempo (día o semana). Es el indicador empírico más confiable para pronosticar fechas de cierre.'
    },
    {
      term: 'Torre de Atención',
      meaning: 'Mecanismo de filtrado prioritario en el Dashboard que agrupa de forma automática los proyectos, tareas o incidencias que requieren intervención inmediata del Líder de Proyecto por retraso o riesgo severo.'
    },
    {
      term: 'Matriz RACI',
      meaning: 'Modelo de asignación de responsabilidades: Responsible (quien hace la tarea), Accountable (quien responde y aprueba), Consulted (a quien se consulta su opinión experta) e Informed (a quien se le mantiene informado del estado).'
    },
    {
      term: 'Matriz RAID',
      meaning: 'Registro sistemático de cuatro factores clave: Riesgos (amenazas potenciales), Suposiciones (hipótesis asumidas), Incidencias (problemas activos) y Dependencias (requerimientos que dependen de terceros).'
    },
    {
      term: 'Entregable (Deliverable)',
      meaning: 'Cualquier resultado tangible, verificable y con valor de negocio producido durante el proyecto (ej. diagnóstico, diseño arquitectónico, módulo de software, acta de comité).'
    }
  ];

  // PM Best Practices & Tips
  const pmBestPractices = [
    {
      title: 'El Ritual de los Lunes: Revisión de la Torre de Atención',
      icon: Target,
      content: 'Comienza cada semana revisando la Torre de Atención en el Dashboard Ejecutivo. Identifica qué tareas vencieron durante el fin de semana o están bloqueadas para establecer las prioridades de los próximos cinco días antes de que los desvíos escalen.'
    },
    {
      title: 'Protege las Tareas de Holgura Cero',
      icon: ShieldAlert,
      content: 'Identifica en el Gantt cuáles son las actividades en la Ruta Crítica. Si un consultor tiene varias tareas simultáneas, dale prioridad absoluta a aquellas que pertenezcan a la ruta crítica para evitar un retraso en cadena del proyecto.'
    },
    {
      title: 'Negociación Objetiva con Clientes y Sponsors',
      icon: Lightbulb,
      content: 'Nunca negocies plazos o aumentos de alcance basándote en apreciaciones subjetivas. Abre el Burndown y muestra la velocidad real demostrada por el equipo: "A nuestro ritmo actual de 3 entregables por semana, incorporar este nuevo requerimiento moverá la fecha de entrega al día 15".'
    },
    {
      title: 'Claridad en la Aprobación (RACI)',
      icon: Users,
      content: 'Asegúrate de que cada cliente o líder de área tenga perfectamente claro quién es su único "Accountable". Si dos directores creen tener la aprobación final, el proyecto se enfrentará a instrucciones contradictorias y retrabajos costosos.'
    },
    {
      title: 'De Riesgo a Incidencia: No Escondas las Amenazas',
      icon: AlertTriangle,
      content: 'Si notas que un proveedor externo no enviará la información a tiempo, regístralo inmediatamente en la Matriz RAID como riesgo alto. Si la fecha límite pasa sin entrega, conviértelo en Incidencia y elévalo al comité con el plan de contingencia predefinido.'
    }
  ];

  // PM FAQ
  const pmFaqs = [
    {
      q: '¿Qué debo hacer si una tarea de la Ruta Crítica se retrasa?',
      a: 'Debes actuar de inmediato aplicando una de dos estrategias de compresión de cronograma: 1) Ejecución rápida (Fast-Tracking): realizar tareas sucesivas en paralelo si es técnicamente factible; o 2) Aceleración (Crashing): asignar recursos o consultores adicionales a esa tarea crítica específica para recuperar el tiempo perdido.'
    },
    {
      q: '¿Cómo puedo saber si mi proyecto está adelantado o atrasado respecto al plan original?',
      a: 'Ve al módulo "Línea Base & Ruta Crítica". Allí verás una comparación visual entre las barras de la Línea Base (lo planeado) y las barras actuales (la realidad). Si la barra actual termina a la derecha de la línea base, tienes un deslizamiento temporal.'
    },
    {
      q: '¿Cómo agrego una nueva categoría o área si mi proyecto no encaja en las existentes?',
      a: 'En "Captura de Datos" (pestaña Nuevo Proyecto), pulsa el enlace azul "+ Nueva categoría" ubicado justo sobre el selector de categoría. Escribe el nombre deseado y presiona "Agregar". La categoría quedará guardada y disponible para todos tus proyectos.'
    },
    {
      q: '¿Por qué la fecha pronosticada en el Burndown es diferente a la fecha límite oficial?',
      a: 'La fecha límite oficial (Deadline) es el compromiso contractual pactado en el calendario. La fecha pronosticada se calcula matemáticamente midiendo el ritmo real al que el equipo ha venido cerrando tareas. Si el pronóstico supera la fecha límite, el sistema te está alertando a tiempo para que tomes medidas correctivas.'
    },
    {
      q: '¿Cómo preparo el reporte para una reunión de avance sin perder horas formateando documentos?',
      a: 'No necesitas elaborar presentaciones manuales. Abre el "Dashboard Ejecutivo" para mostrar los semáforos de salud y la Torre de Atención, o pulsa el botón "Imprimir / PDF" en esta misma guía para descargar un resumen estructurado y auditable.'
    }
  ];

  // Filtered lists based on search
  const q = searchTerm.toLowerCase().trim();

  const filteredWorkflows = useMemo(() => {
    if (!q) return pmWorkflows;
    return pmWorkflows.filter(w => 
      w.title.toLowerCase().includes(q) ||
      w.tagline.toLowerCase().includes(q) ||
      w.objective.toLowerCase().includes(q) ||
      w.actionSteps.some(s => s.toLowerCase().includes(q)) ||
      w.pmTip.toLowerCase().includes(q)
    );
  }, [q, pmWorkflows]);

  const filteredGlossary = useMemo(() => {
    if (!q) return pmGlossary;
    return pmGlossary.filter(g => 
      g.term.toLowerCase().includes(q) ||
      g.meaning.toLowerCase().includes(q)
    );
  }, [q, pmGlossary]);

  const filteredBestPractices = useMemo(() => {
    if (!q) return pmBestPractices;
    return pmBestPractices.filter(b => 
      b.title.toLowerCase().includes(q) ||
      b.content.toLowerCase().includes(q)
    );
  }, [q, pmBestPractices]);

  const filteredFaqs = useMemo(() => {
    if (!q) return pmFaqs;
    return pmFaqs.filter(f => 
      f.q.toLowerCase().includes(q) ||
      f.a.toLowerCase().includes(q)
    );
  }, [q, pmFaqs]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-16 animate-fade-in">
      {/* Executive Header Banner */}
      <div className="bg-[#0f172a] text-white rounded-2xl p-6 md:p-8 shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 opacity-5 pointer-events-none flex items-center justify-end pr-8">
          <BookOpen className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-3xl">
            <div className="flex items-center gap-2.5">
              <span className="px-2.5 py-1 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-bold uppercase tracking-wider">
                Guía Práctica de Gestión de Proyectos
              </span>
              <span className="text-xs text-slate-400">
                Metodología CSEA v4.0 · Uso Diario Sin Fricción
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Manual de Uso para Líderes de Proyecto y Consultores
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed">
              Aprende a planificar iniciativas, balancear roles con la matriz RACI, controlar la ruta crítica y anticipar desvíos con el análisis de velocidad de forma ágil y ejecutiva.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={onStartTour}
              className="flex items-center gap-2 px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition-all shadow-md hover:shadow-orange-600/20 active:scale-95 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              <span>Iniciar Recorrido Guiado</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 transition-colors cursor-pointer"
              title="Imprimir o exportar como PDF"
            >
              <Printer className="w-4 h-4 text-slate-300" />
              <span className="hidden sm:inline">Imprimir / PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar: Live Search & Thematic Navigation Tabs */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por concepto de gestión (ej. Burndown, RACI, Holgura, Ruta Crítica)..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500 transition-all"
          />
        </div>

        {/* Tab Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'workflows', label: 'Flujos Paso a Paso (1 a 7)' },
            { id: 'glossary', label: 'Glosario de PM' },
            { id: 'best-practices', label: 'Consejos de Éxito' },
            { id: 'faq', label: 'Preguntas Frecuentes' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-[#0f172a] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: WORKFLOWS PASO A PASO */}
      {activeTab === 'workflows' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-600" />
                Flujos de Trabajo Cotidianos del Líder de Proyecto
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Guía secuencial para operar la plataforma durante todo el ciclo de vida del proyecto
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono hidden sm:inline">
              {filteredWorkflows.length} de {pmWorkflows.length} pasos
            </span>
          </div>

          <div className="space-y-5">
            {filteredWorkflows.map((flow) => (
              <div 
                key={flow.id} 
                className="bg-white rounded-xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                {/* Step Header */}
                <div className="p-5 md:p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="flex items-start gap-3.5">
                    <span className="w-9 h-9 rounded-xl bg-[#0f172a] text-orange-400 font-bold text-xs flex items-center justify-center shrink-0 font-mono shadow-xs">
                      {flow.number}
                    </span>
                    <div>
                      <h3 className="text-sm md:text-base font-bold text-slate-900 leading-snug">
                        {flow.title}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium mt-0.5">
                        {flow.tagline}
                      </p>
                    </div>
                  </div>

                  {/* Direct Action Buttons to open the corresponding module */}
                  <div className="flex items-center gap-2 self-start md:self-auto shrink-0">
                    <button
                      onClick={() => onNavigateToView(flow.targetView)}
                      className="px-3 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shadow-xs cursor-pointer active:scale-95"
                      title={`Ir a ${flow.viewLabel}`}
                    >
                      <span>{flow.viewLabel}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    {flow.secondaryView && flow.secondaryLabel && (
                      <button
                        onClick={() => onNavigateToView(flow.secondaryView)}
                        className="px-3 py-2 bg-white hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-300 transition-colors cursor-pointer"
                        title={`Ir a ${flow.secondaryLabel}`}
                      >
                        <span>{flow.secondaryLabel}</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Step Body */}
                <div className="p-5 md:p-6 space-y-4">
                  {/* Objective */}
                  <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 leading-relaxed">
                    <span className="font-bold text-slate-900 block mb-1">🎯 Objetivo del Paso:</span>
                    {flow.objective}
                  </div>

                  {/* Action Steps Checklist */}
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-2">
                      Procedimiento en la Aplicación
                    </span>
                    <ol className="space-y-2">
                      {flow.actionSteps.map((step, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700 leading-relaxed">
                          <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-800 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                            {idx + 1}
                          </span>
                          <span>{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>

                  {/* PM Pro Tip Callout */}
                  <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex items-start gap-3">
                    <Lightbulb className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-xs leading-relaxed">
                      <span className="font-bold text-amber-950 block">Consejo del Líder de Proyecto:</span>
                      <p className="text-amber-900 mt-0.5">{flow.pmTip}</p>
                    </div>
                  </div>

                  {/* Expected Deliverables */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs text-slate-600">
                    <span className="font-bold text-slate-800">Resultados tangibles:</span>
                    {flow.deliverables.map((item, i) => (
                      <span key={i} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 text-[11px]">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}

            {filteredWorkflows.length === 0 && (
              <div className="p-12 text-center bg-white rounded-xl border border-slate-200">
                <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">No se encontraron flujos para "{searchTerm}"</p>
                <p className="text-xs text-slate-500 mt-1">Intenta con términos como "RACI", "Burndown", "Línea Base" o "Riesgos".</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: GLOSSARY */}
      {activeTab === 'glossary' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-orange-600" />
                Glosario Esencial de Gestión de Proyectos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Definiciones prácticas de los conceptos clave utilizados en la plataforma
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              {filteredGlossary.length} términos
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredGlossary.map((g, idx) => (
              <div 
                key={idx} 
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs hover:border-slate-300 transition-all space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500" />
                    {g.term}
                  </h3>
                  <button
                    onClick={() => handleCopySection(`gl-${idx}`, `${g.term}: ${g.meaning}`)}
                    className="text-[10px] text-slate-400 hover:text-slate-600 flex items-center gap-1 font-medium"
                    title="Copiar definición"
                  >
                    {copiedSection === `gl-${idx}` ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedSection === `gl-${idx}` ? 'Copiado' : 'Copiar'}</span>
                  </button>
                </div>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {g.meaning}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: BEST PRACTICES & TIPS */}
      {activeTab === 'best-practices' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-orange-600" />
                Consejos de Éxito y Buenas Prácticas del PM
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Recomendaciones tácticas para elevar la calidad de supervisión y comunicación con patrocinadores
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {filteredBestPractices.map((tip, idx) => {
              const IconComp = tip.icon;
              return (
                <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center border border-orange-200/80">
                      <IconComp className="w-4 h-4" />
                    </div>
                    <h3 className="text-sm font-bold text-slate-900">
                      {tip.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-700 leading-relaxed pl-10">
                    {tip.content}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 4: FAQ */}
      {activeTab === 'faq' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1">
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-orange-600" />
                Preguntas Frecuentes de Gestión de Proyectos
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Respuestas directas a dudas habituales durante la ejecución
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {filteredFaqs.map((faq, idx) => (
              <div key={idx} className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-2">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-2">
                  <span className="text-orange-600 font-mono">Q{idx + 1}.</span>
                  {faq.q}
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed pl-6">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer Support Banner */}
      <div className="bg-slate-100 rounded-xl p-5 border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-600">
        <div>
          <p className="font-bold text-slate-900">
            Metodología Capricorn Strategic Execution Assessment® (CSEA v4.0)
          </p>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Manual práctico diseñado para una experiencia fluida, gobernanza preventiva y entrega oportuna de resultados.
          </p>
        </div>

        <button
          onClick={onStartTour}
          className="px-4 py-2 bg-[#0f172a] hover:bg-slate-800 text-white rounded-lg font-bold text-xs transition-colors shrink-0 flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5 text-orange-400" />
          <span>Ver Recorrido Guiado</span>
        </button>
      </div>
    </div>
  );
};

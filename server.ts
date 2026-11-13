import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '10mb' }));

// Inicialización de la API de Gemini (SDK oficial @google/genai)
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

interface ForecastRequest {
  projectName: string;
  category?: string;
  startDate: string;
  targetDeadline: string;
  totalTasks: number;
  completedTasks: number;
  remainingTasks: number;
  overdueTasks: number;
  burndownPoints?: Array<{
    date: string;
    label: string;
    ideal: number;
    actual: number | null;
  }>;
}

interface ForecastPoint {
  date: string;
  label: string;
  forecast: number;
}

interface ForecastResponse {
  success: boolean;
  estimatedCompletionDate: string;
  projectedVarianceDays: number;
  velocityPerDay: number;
  requiredVelocityPerDay: number;
  confidenceLevel: 'Alta' | 'Media' | 'Baja';
  executiveSummary: string;
  keyObservations: string[];
  mitigationRecommendations: string[];
  forecastPoints: ForecastPoint[];
  isAiGenerated: boolean;
}

// -------------------------------------------------------------
// Endpoint: POST /api/gemini/burndown-forecast
// -------------------------------------------------------------
app.post('/api/gemini/burndown-forecast', async (req: Request, res: Response) => {
  try {
    const data: ForecastRequest = req.body;
    const {
      projectName,
      category = 'General',
      startDate,
      targetDeadline,
      totalTasks,
      completedTasks,
      remainingTasks,
      overdueTasks,
      burndownPoints = [],
    } = data;

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const start = new Date(startDate || todayStr);
    const deadline = new Date(targetDeadline || todayStr);

    const elapsedDays = Math.max(1, Math.round((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
    const daysUntilDeadline = Math.max(1, Math.round((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

    // Velocidad empírica calculada
    const velocityPerDay = Math.max(0.05, Math.round((completedTasks / elapsedDays) * 100) / 100);
    const requiredVelocityPerDay = Math.round((remainingTasks / daysUntilDeadline) * 100) / 100;

    // Cálculo matemático de base para días adicionales requeridos
    const daysNeededAtCurrentVelocity = Math.ceil(remainingTasks / velocityPerDay);
    const projectedDate = new Date(today.getTime() + daysNeededAtCurrentVelocity * 24 * 60 * 60 * 1000);
    const projectedDateStr = projectedDate.toISOString().split('T')[0];
    const varianceDays = Math.round((projectedDate.getTime() - deadline.getTime()) / (1000 * 60 * 60 * 24));

    // Si hay API key disponible, invocamos el modelo gratuito gemini-3.8-flash
    if (apiKey) {
      try {
        const prompt = `
Eres el Director de Consultoría Estratégica de Capricorn Consulting, especialista en la metodología Capricorn Strategic Execution Assessment (CSEA v4.0).
Analiza las métricas actuales del Burndown Chart y calcula un pronóstico predictivo de finalización:

Datos del Proyecto:
- Nombre: "${projectName}" (${category})
- Fecha de inicio: ${startDate}
- Fecha límite pactada (Deadline): ${targetDeadline}
- Fecha actual: ${todayStr} (Días transcurridos: ${elapsedDays})
- Total de entregables/tareas: ${totalTasks}
- Tareas completadas: ${completedTasks}
- Tareas pendientes: ${remainingTasks}
- Tareas actualmente vencidas: ${overdueTasks}
- Velocidad actual registrada: ${velocityPerDay} tareas/día
- Velocidad requerida para cumplir la fecha límite: ${requiredVelocityPerDay} tareas/día
- Historial de puntos del burndown: ${JSON.stringify(burndownPoints.slice(-6))}

Reglas de Negocio CSEA v4.0:
1. Tono consultivo C-Level: Sin lenguaje dramático ni alarmista; plantea la desviación como exposición potencial de plazo.
2. Basado en la velocidad real (${velocityPerDay} tareas/día), proyecta la fecha estimada realista en que las ${remainingTasks} tareas restantes se extinguirán.
3. Proporciona de 4 a 6 puntos de proyección temporal desde hoy (${todayStr}) hasta la fecha estimada de término, donde el valor va decreciendo desde ${remainingTasks} hasta 0.
4. Nivel de confianza: 'Alta', 'Media' o 'Baja' según la consistencia de la velocidad y cantidad de tareas vencidas.
`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction: 'Responde exclusivamente en formato JSON válido conforme al esquema especificado. Tono consultivo ejecutivo formal.',
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                estimatedCompletionDate: { 
                  type: Type.STRING, 
                  description: 'Fecha estimada de finalización en formato YYYY-MM-DD' 
                },
                projectedVarianceDays: { 
                  type: Type.INTEGER, 
                  description: 'Días de desviación respecto a la meta (positivo retraso, negativo adelanto)' 
                },
                confidenceLevel: { 
                  type: Type.STRING, 
                  enum: ['Alta', 'Media', 'Baja'] 
                },
                executiveSummary: { 
                  type: Type.STRING, 
                  description: 'Resumen ejecutivo consultivo del pronóstico y la velocidad de ejecución' 
                },
                keyObservations: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: 'Observaciones clave sobre el ritmo del equipo y cuellos de botella' 
                },
                mitigationRecommendations: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING },
                  description: 'Recomendaciones estratégicas de mitigación' 
                },
                forecastPoints: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      date: { type: Type.STRING },
                      label: { type: Type.STRING },
                      forecast: { type: Type.NUMBER }
                    },
                    required: ['date', 'label', 'forecast']
                  }
                }
              },
              required: [
                'estimatedCompletionDate',
                'projectedVarianceDays',
                'confidenceLevel',
                'executiveSummary',
                'keyObservations',
                'mitigationRecommendations',
                'forecastPoints'
              ]
            }
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        const forecastResponse: ForecastResponse = {
          success: true,
          estimatedCompletionDate: parsed.estimatedCompletionDate || projectedDateStr,
          projectedVarianceDays: typeof parsed.projectedVarianceDays === 'number' ? parsed.projectedVarianceDays : varianceDays,
          velocityPerDay,
          requiredVelocityPerDay,
          confidenceLevel: parsed.confidenceLevel || (overdueTasks > 0 ? 'Media' : 'Alta'),
          executiveSummary: parsed.executiveSummary || `A la velocidad observada de ${velocityPerDay} entregables/día, los resultados sugieren una fecha estimada de cierre el ${projectedDateStr}.`,
          keyObservations: parsed.keyObservations || [
            `El equipo mantiene una tasa de cierre de ${velocityPerDay} entregables por día calendario.`,
            `Para cumplir con el plazo meta del ${targetDeadline}, se requeriría acelerar a ${requiredVelocityPerDay} tareas/día.`
          ],
          mitigationRecommendations: parsed.mitigationRecommendations || [
            'Evaluar la redistribución de asignaciones en las tareas críticas dentro de la matriz RACI.',
            'Optimizar el flujo de aprobaciones quincenales para eliminar tiempos de espera.'
          ],
          forecastPoints: Array.isArray(parsed.forecastPoints) && parsed.forecastPoints.length > 0 
            ? parsed.forecastPoints 
            : generateFallbackForecastPoints(todayStr, projectedDateStr, remainingTasks),
          isAiGenerated: true
        };

        return res.json(forecastResponse);
      } catch (geminiError) {
        console.warn('Advertencia en llamada Gemini API, usando cálculo analítico CSEA:', geminiError);
      }
    }

    // Fallback matemático robusto si no hay API key o si hubo error transitorio
    const fallbackPoints = generateFallbackForecastPoints(todayStr, projectedDateStr, remainingTasks);
    const fallbackResponse: ForecastResponse = {
      success: true,
      estimatedCompletionDate: projectedDateStr,
      projectedVarianceDays: varianceDays,
      velocityPerDay,
      requiredVelocityPerDay,
      confidenceLevel: overdueTasks > 0 ? 'Media' : 'Alta',
      executiveSummary: `Los resultados sugieren que al ritmo actual de ${velocityPerDay} entregables diarios, el proyecto culminará tentativamente el ${projectedDateStr}, presentando una variación proyectada de ${varianceDays > 0 ? `+${varianceDays}` : varianceDays} días respecto al plazo objetivo.`,
      keyObservations: [
        `Velocidad real de entrega: ${velocityPerDay} tareas/día con ${remainingTasks} entregables pendientes.`,
        `Tasa necesaria para entrega en fecha meta: ${requiredVelocityPerDay} tareas/día.`
      ],
      mitigationRecommendations: [
        'Priorizar la resolución de tareas con fechas comprometidas próximas a vencer.',
        'Revisar holguras en la ruta crítica del cronograma para nivelar la carga de trabajo.'
      ],
      forecastPoints: fallbackPoints,
      isAiGenerated: false
    };

    return res.json(fallbackResponse);
  } catch (error) {
    console.error('Error procesando pronóstico de burndown:', error);
    return res.status(500).json({
      success: false,
      error: 'No se pudo generar el pronóstico de velocidad y fecha estimada.'
    });
  }
});

// Generador de puntos de proyección temporal para Recharts
function generateFallbackForecastPoints(startDateStr: string, endDateStr: string, totalRemaining: number): ForecastPoint[] {
  const points: ForecastPoint[] = [];
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  const diffDays = Math.max(1, Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)));
  const steps = Math.min(5, Math.max(3, Math.round(diffDays / 5)));
  const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  for (let i = 0; i <= steps; i++) {
    const frac = i / steps;
    const pDate = new Date(start.getTime() + (diffDays * frac) * 24 * 60 * 60 * 1000);
    const dateStr = pDate.toISOString().split('T')[0];
    const label = `${pDate.getUTCDate()} ${monthNames[pDate.getUTCMonth()]}`;
    const remaining = Math.max(0, Math.round((1 - frac) * totalRemaining * 10) / 10);
    points.push({ date: dateStr, label, forecast: remaining });
  }

  return points;
}

// -------------------------------------------------------------
// Servidor Vite / Estático
// -------------------------------------------------------------
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CSEA Platform] Servidor operativo en puerto ${PORT} (${isDev ? 'Desarrollo Vite' : 'Producción'})`);
  });
}

startServer();

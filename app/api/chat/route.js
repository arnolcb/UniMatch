import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

// Lógica para manejar las respuestas del cuestionario y recomendar universidades
async function handleQuestionnaire() {
  const questions = [
    "¿Cuál es tu materia favorita en el colegio?",
    "¿Qué actividades disfrutas hacer en tu tiempo libre?",
    "¿Prefieres trabajar en equipo o de manera individual?",
    "¿Te interesan más las ciencias exactas o las humanidades?",
    "¿Tienes alguna habilidad técnica o artística que te gustaría desarrollar?"
  ];

  // Aquí podrías procesar las respuestas y orientar las recomendaciones
  // por ejemplo, almacenarlas y analizarlas para sugerir universidades

  return questions;
}

function recommendUniversity(skill) {
  const universities = {
    "ingeniería": { name: "Universidad Nacional de Ingeniería (UNI)", url: "https://www.uni.edu.pe/" },
    "medicina": { name: "Universidad Peruana Cayetano Heredia (UPCH)", url: "https://www.upch.edu.pe/" },
    "derecho": { name: "Pontificia Universidad Católica del Perú (PUCP)", url: "https://www.pucp.edu.pe/" },
    // Añadir más universidades y links según habilidades
  };

  return universities[skill] || { name: "Universidad no encontrada", url: "" };
}

export async function POST(req) {
  let { messages } = await req.json();
  messages = [
    {
      role: 'system',
      content: 'Tú eres UniMatch. Un asistente virtual que ayuda a jóvenes peruanos a elegir una universidad donde estudiar en Lima, Perú. Solo respondes preguntas relacionadas con la elección de universidades y temas educativos. Si se te pregunta algo fuera de este contexto, responde que solo estás capacitado para ayudar con la elección de universidades.',
    },
    ...messages,
  ];

  const userMessage = messages[messages.length - 1].content.toLowerCase();

  const validTopics = ['universidad', 'educación', 'carrera', 'estudios', 'habilidades'];

  if (!validTopics.some(topic => userMessage.includes(topic))) {
    return new StreamingTextResponse('Lo siento, solo estoy capacitado para ayudar con la elección de universidades y temas educativos.');
  }

  if (userMessage.split(' ').length < 5 || userMessage.includes('cuestionario') || userMessage.includes('preguntas')) {
    const questionnaire = await handleQuestionnaire();
    return new StreamingTextResponse(`Aquí tienes algunas preguntas para conocerte mejor: ${questionnaire.join(', ')}`);
  }

  // Analizar el mensaje para recomendar universidad basada en habilidades
  const skillKeywords = ['ingeniería', 'medicina', 'derecho']; // Añadir más habilidades según sea necesario
  let recommendedUniversity = null;

  skillKeywords.forEach(skill => {
    if (userMessage.includes(skill)) {
      recommendedUniversity = recommendUniversity(skill);
    }
  });

  // Crear la respuesta de OpenAI con la recomendación de universidad si aplica
  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    stream: true,
    messages,
  });

  const stream = OpenAIStream(response);

  if (recommendedUniversity) {
    const universityInfo = `Te recomiendo considerar ${recommendedUniversity.name}. Puedes obtener más información visitando su página: ${recommendedUniversity.url}`;
    return new StreamingTextResponse(`${stream}\n\n${universityInfo}`);
  }

  return new StreamingTextResponse(stream);
}

import OpenAI from 'openai';
import { OpenAIStream, StreamingTextResponse } from 'ai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const runtime = 'edge';

export async function POST(req) {
  let { messages } = await req.json();
  messages = [
    {
      role: 'system',
      content: 'Tú eres UniMatch. Un asistente virtual que ayuda a jóvenes peruanos a elegir una universidad donde estudiar en Lima, Perú',
    },
    ...messages,
  ];

  const response = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    stream: true,
    messages,
  });

  const stream = OpenAIStream(response);
  return new StreamingTextResponse(stream);
}

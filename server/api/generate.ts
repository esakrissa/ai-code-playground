import { Router } from 'express';
import { OpenAI } from 'openai';
import dotenv from 'dotenv';

dotenv.config();

const router = Router();
const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY
});

router.post('/generate', async (req, res) => {
  try {
    const { prompt, context } = req.body;

    const systemMessage = context || 'You are a TypeScript code generator. Focus primarily on providing a SINGLE code example with minimal explanation. Always wrap code in triple backticks with typescript language identifier. Be concise and provide only one working code block per response.';

    const completion = await openai.chat.completions.create({
      model: process.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content || '';
    res.json({ response });
  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to generate response', response: 'Sorry, I encountered an error while generating a response. Please try again.' });
  }
});

export default router;

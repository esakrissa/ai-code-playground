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
        const { prompt } = req.body;
        const completion = await openai.chat.completions.create({
            model: process.env.VITE_OPENAI_MODEL || 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a helpful AI assistant that generates TypeScript code examples. Only respond with the code, no explanations or markdown.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            temperature: 0.7,
        });
        const code = completion.choices[0]?.message?.content || '';
        res.json({ code });
    }
    catch (error) {
        console.error('OpenAI API error:', error);
        res.status(500).json({ error: 'Failed to generate code' });
    }
});
export default router;

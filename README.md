# AI Code Playground

A modern TypeScript playground with AI code assistant integration.

## Features

- Real-time TypeScript code execution
- AI coding assistant
- Light and dark theme support
- Interactive UI

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root directory with your OpenAI API key:
   ```
   VITE_OPENAI_API_KEY=your_api_key_here
   VITE_OPENAI_MODEL=gpt-4-turbo-preview # or your preferred model
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```
5. In a separate terminal, start the API server:
   ```bash
   # On macOS/Linux:
   npm start
   
   # On Windows:
   npm run start:windows
   ```

## Build for Production

```bash
npm run build
```

## Technologies Used

- React
- TypeScript
- Vite
- OpenAI API
- Express 
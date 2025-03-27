# AI Code Playground

Interactive TypeScript playground with AI-powered code assistance.

## Features

- Real-time TypeScript code execution
- AI coding assistant integration
- Dark/light theme support
- Interactive code editor
- Clean single-line array output formatting
- Support for classes with static members
- Improved function execution with direct parameter support
- Whitespace rendering on selection
- Indentation guides for better code readability

## Setup

1. Clone the repository
2. Install dependencies: `npm install`
3. Create `.env` file with your OpenAI API key:
   ```
   OPENAI_API_KEY=your_api_key_here
   OPENAI_MODEL=gpt-4-turbo-preview
   ```
4. Start development server: `npm run dev`
5. Start API server: `npm start` (or `npm run start:windows` on Windows)

## Build

```bash
npm run build
```

## Technology Stack

### Frontend
- React 19 with TypeScript
- Monaco Editor for code editing and syntax highlighting
- Vite 6 for fast development and building
- Custom theming system with context API

### Backend
- Node.js with Express 4
- OpenAI API v4 integration
- TypeScript execution with Babel
- ts-node for development

### Development Tools
- ESLint for code quality
- Git for version control
- npm for package management

## License

© Esa Krissa 2025. This project is licensed under the MIT License. 
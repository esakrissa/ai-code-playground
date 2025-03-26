import React, { useState, useEffect, useRef, useContext } from 'react';
import { ThemeContext } from '../themes';

interface Message {
  type: 'user' | 'ai';
  content: string;
}

interface AICodeAssistantProps {
  onAcceptCode: (code: string) => void;
  onWidthChange?: (width: number) => void;
}

const AICodeAssistant: React.FC<AICodeAssistantProps> = ({ onAcceptCode, onWidthChange }) => {
  const { colors } = useContext(ThemeContext);
  const [isExpanded, setIsExpanded] = useState(true);
  const [width, setWidth] = useState(300);
  const [isDragging, setIsDragging] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { 
      type: 'ai', 
      content: 'I can help you generate TypeScript code. Ask me anything!' 
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Start resizing on mouse down
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // Update width on mouse move
  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;
    
    // Calculate new width (window width - mouse position from right)
    const newWidth = window.innerWidth - e.clientX;
    
    // Set constraints: min 250px, max 50% of window width or 600px, whichever is smaller
    const maxWidth = Math.min(Math.floor(window.innerWidth / 2), 600);
    const constrainedWidth = Math.min(Math.max(250, newWidth), maxWidth);
    
    setWidth(constrainedWidth);
    
    // Notify parent component about width change
    onWidthChange?.(constrainedWidth);
  };

  // Stop resizing on mouse up
  const handleMouseUp = () => {
    setIsDragging(false);
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  // Clean up event listeners when component unmounts
  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Notify parent component about initial width
  useEffect(() => {
    if (isExpanded) {
      onWidthChange?.(width);
    } else {
      onWidthChange?.(50);
    }
  }, [width, isExpanded, onWidthChange]);

  // Add resize event listener to handle browser window resizing
  useEffect(() => {
    const handleResize = () => {
      // Make sure sidebar width doesn't exceed half the window or 600px
      const maxWidth = Math.min(Math.floor(window.innerWidth / 2), 600);
      if (width > maxWidth) {
        setWidth(maxWidth);
        onWidthChange?.(maxWidth);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, onWidthChange]);

  // Connect to OpenAI server
  const generateResponse = async (userMessage: string) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          prompt: userMessage,
          context: "You are a TypeScript code generator. Focus primarily on providing a SINGLE code example with minimal explanation. Always wrap code in triple backticks with typescript language identifier. Be concise and provide only one working code block per response."
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch from API');
      }
      
      const data = await response.json();
      setIsLoading(false);
      return data.response || 'Sorry, I could not generate a response at this time.';
    } catch (error) {
      console.error('Error fetching from OpenAI:', error);
      setIsLoading(false);
      
      // Fallback to pattern matching if server is unavailable
      const lowercaseMessage = userMessage.toLowerCase();
      
      if (lowercaseMessage.includes('hello') || lowercaseMessage.includes('hi')) {
        return 'Hello! How can I help you with your TypeScript code today?';
      } else if (lowercaseMessage.includes('help') && lowercaseMessage.includes('function')) {
        return 'I can help with TypeScript functions! Here\'s a simple example:\n\n```typescript\nconst greet = (name: string): string => {\n  return `Hello, ${name}!`;\n};\n\nconst userName: string = "Alice";\nconsole.log(greet(userName));\n```\n\nThis function takes a string parameter and returns a greeting message.';
      } else if (lowercaseMessage.includes('tell') && lowercaseMessage.includes('joke')) {
        return 'Here\'s a programming joke:\n\nWhy do programmers prefer dark mode?\n\nBecause light attracts bugs!\n\nWant me to make a simple function about this?\n\n```typescript\nconst tellJoke = (): string => {\n  return "Why do programmers prefer dark mode? Because light attracts bugs!";\n};\n\nconsole.log(tellJoke());\n```';
      } else if (lowercaseMessage.includes('class') || lowercaseMessage.includes('interface')) {
        return 'Here\'s an example of a TypeScript class and interface:\n\n```typescript\ninterface Vehicle {\n  make: string;\n  model: string;\n  year: number;\n  start(): void;\n}\n\nclass Car implements Vehicle {\n  make: string;\n  model: string;\n  year: number;\n  private _isRunning: boolean = false;\n  \n  constructor(make: string, model: string, year: number) {\n    this.make = make;\n    this.model = model;\n    this.year = year;\n  }\n  \n  start(): void {\n    this._isRunning = true;\n    console.log(`The ${this.make} ${this.model} is now running.`);\n  }\n  \n  stop(): void {\n    this._isRunning = false;\n    console.log(`The ${this.make} ${this.model} has stopped.`);\n  }\n}\n\nconst myCar = new Car("Toyota", "Corolla", 2020);\nmyCar.start();\nmyCar.stop();\n```';
      } else {
        return 'I can help you with TypeScript code! Try asking for examples of functions, classes, interfaces, or other TypeScript concepts. Or I can explain how specific features work.';
      }
    }
  };

  const handleMessageSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    // Add user message to chat
    const newUserMessage: Message = { type: 'user', content: inputValue };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInputValue('');
    
    try {
      // Generate AI response
      const response = await generateResponse(inputValue);
      const newAIMessage: Message = { type: 'ai', content: response };
      setMessages(prevMessages => [...prevMessages, newAIMessage]);
    } catch (error) {
      console.error('Error generating response:', error);
      const errorMessage: Message = { 
        type: 'ai', 
        content: 'Sorry, I encountered an error while generating a response. Please try again.' 
      };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    }
  };

  const handleCodeAccept = (messageContent: string) => {
    // Extract code between triple backticks
    const codeRegex = /```(?:typescript|ts)?\n([\s\S]*?)\n```/g;
    const matches = [...messageContent.matchAll(codeRegex)];
    
    if (matches.length > 0) {
      // Use the last code block found
      const lastMatch = matches[matches.length - 1];
      onAcceptCode(lastMatch[1]);
    }
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code).then(() => {
      // Show visual feedback
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    }).catch(err => {
      console.error('Failed to copy code: ', err);
    });
  };

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div style={{
      width: isExpanded ? `${width}px` : '50px',
      height: '100vh',
      position: 'relative',
      transition: isExpanded && !isDragging ? 'width 0.3s ease' : 'none',
      borderLeft: `1px solid ${colors.sidebarBorder}`,
      background: colors.sidebar,
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
    }}>
      {/* Resize handle */}
      {isExpanded && (
        <div
          ref={resizeHandleRef}
          className="resize-handle"
          onMouseDown={handleMouseDown}
          style={{
            position: 'absolute',
            top: 0,
            left: '-10px',
            width: '20px',
            height: '100%',
            cursor: 'col-resize',
            zIndex: 20,
            background: isDragging ? `rgba(${colors.primary.replace(/[^\d,]/g, '')}, 0.1)` : 'transparent',
          }}
        >
          <div style={{
            position: 'absolute',
            left: '2px',
            top: '50%',
            height: '50px',
            width: '4px',
            borderRadius: '2px',
            background: isDragging ? colors.primary : 'rgba(127,127,127,0.3)',
            transform: 'translateY(-50%)',
            opacity: isDragging ? 0.8 : 0,
            transition: 'opacity 0.3s ease, background 0.3s ease',
          }} />
        </div>
      )}

      {/* Toggle button */}
      <button 
        onClick={() => {
          const newState = !isExpanded;
          setIsExpanded(newState);
          onWidthChange?.(newState ? width : 50);
        }}
        aria-label={isExpanded ? 'Collapse assistant' : 'Expand assistant'}
        style={{
          position: 'absolute',
          top: '10px',
          left: isExpanded ? '20px' : '10px',
          zIndex: 10,
          width: '30px',
          height: '30px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: colors.sidebar,
          border: `1px solid ${colors.sidebarBorder}`,
          borderRadius: '4px',
          cursor: 'pointer',
          color: colors.foreground,
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        }}
      >
        {isExpanded ? (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 5l-7 7 7 7"></path>
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 5l7 7-7 7"></path>
          </svg>
        )}
      </button>
      
      {isExpanded && (
        <>
          <div style={{ 
            padding: '15px 15px 15px 60px', 
            borderBottom: `1px solid ${colors.sidebarBorder}`,
            background: colors.sidebar,
          }}>
            <h2 style={{ 
              margin: 0, 
              fontSize: '16px',
              color: colors.foreground,
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              AI Code Assistant
            </h2>
          </div>
          
          <div style={{ 
            flex: 1, 
            overflowY: 'auto', 
            padding: '15px',
            display: 'flex',
            flexDirection: 'column',
            gap: '15px',
          }}>
            {messages.map((message, index) => (
              <div 
                key={index} 
                style={{ 
                  alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  padding: '10px 15px',
                  borderRadius: '12px',
                  background: message.type === 'user' ? colors.userMessage : colors.aiMessage,
                  borderTopLeftRadius: message.type === 'ai' ? '4px' : '12px',
                  borderTopRightRadius: message.type === 'user' ? '4px' : '12px',
                  whiteSpace: 'pre-wrap',
                  color: colors.foreground,
                }}
              >
                {message.content.includes('```') ? (
                  <div>
                    {message.content.split(/```(?:typescript|ts)?\n|```/).map((part, i) => {
                      // Every even index is regular text, odd index is code
                      if (i % 2 === 0) {
                        return <div key={i} style={{ marginBottom: i < message.content.split(/```(?:typescript|ts)?\n|```/).length - 1 ? '10px' : 0 }}>{part}</div>;
                      } else {
                        const codeIndex = Math.floor(i/2);
                        return (
                          <div key={i} style={{ position: 'relative' }}>
                            {message.type === 'ai' && (
                              <div style={{
                                display: 'flex',
                                justifyContent: 'flex-end',
                                gap: '5px',
                                marginBottom: '5px'
                              }}>
                                <button 
                                  onClick={() => handleCopyCode(part, codeIndex)}
                                  style={{
                                    background: colors.secondary,
                                    color: colors.foreground,
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    padding: '3px 8px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    alignItems: 'center',
                                  }}
                                >
                                  {copiedIndex === codeIndex ? '✓ Copied' : 'Copy'}
                                </button>
                                <button 
                                  onClick={() => onAcceptCode(part)}
                                  style={{
                                    background: colors.primary,
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    fontSize: '11px',
                                    padding: '3px 8px',
                                    cursor: 'pointer',
                                  }}
                                >
                                  Use
                                </button>
                              </div>
                            )}
                            <pre style={{ 
                              background: colors.codeBackground, 
                              padding: '10px', 
                              borderRadius: '6px', 
                              overflowX: 'auto',
                              fontSize: '13px',
                              margin: '0',
                              color: colors.foreground,
                            }}>
                              <code>{part}</code>
                            </pre>
                          </div>
                        );
                      }
                    })}
                  </div>
                ) : (
                  <div>{message.content}</div>
                )}
              </div>
            ))}
            
            {isLoading && (
              <div style={{ 
                alignSelf: 'flex-start',
                display: 'flex',
                gap: '4px',
                paddingLeft: '15px',
                color: colors.foreground,
                opacity: 0.7,
              }}>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: colors.foreground,
                  animation: 'pulse 1s infinite',
                  animationDelay: '0s',
                }}></div>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: colors.foreground,
                  animation: 'pulse 1s infinite',
                  animationDelay: '0.2s',
                }}></div>
                <div style={{ 
                  width: '8px', 
                  height: '8px', 
                  borderRadius: '50%', 
                  background: colors.foreground,
                  animation: 'pulse 1s infinite',
                  animationDelay: '0.4s',
                }}></div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          <form 
            onSubmit={handleMessageSubmit}
            style={{ 
              padding: '15px', 
              borderTop: `1px solid ${colors.sidebarBorder}`,
              display: 'flex',
              gap: '10px',
            }}
          >
            <input 
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="What code do you need?"
              style={{
                flex: 1,
                padding: '10px 12px',
                borderRadius: '6px',
                border: `1px solid ${colors.border}`,
                fontSize: '14px',
                background: colors.inputBackground,
                color: colors.foreground,
              }}
            />
            <button 
              type="submit"
              style={{
                padding: '10px 12px',
                background: colors.primary,
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
            >
              Send
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default AICodeAssistant; 
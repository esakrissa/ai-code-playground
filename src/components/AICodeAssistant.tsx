import React, { useState, useEffect, useRef, useContext } from 'react';
import { ThemeContext } from '../themes';
import Editor from '@monaco-editor/react';

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
  const [isExpanded, setIsExpanded] = useState(() => {
    // Try to get saved state from localStorage, default to true if not found
    const savedState = localStorage.getItem('aiAssistantExpanded');
    return savedState === null ? true : savedState === 'true';
  });
  const [width, setWidth] = useState(() => {
    // Try to get saved width from localStorage, default to 400 if not found
    const savedWidth = localStorage.getItem('aiAssistantWidth');
    return savedWidth === null ? 400 : parseInt(savedWidth, 10);
  });
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
  const editorRefs = useRef<Map<number, any>>(new Map());

  // Save expanded state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('aiAssistantExpanded', isExpanded.toString());
  }, [isExpanded]);
  
  // Save width to localStorage (but only when not dragging to avoid excessive writes)
  useEffect(() => {
    if (!isDragging) {
      localStorage.setItem('aiAssistantWidth', width.toString());
    }
  }, [width, isDragging]);

  // Start resizing on mouse down
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    
    // Get initial position - handle both mouse and touch events
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const initialX = clientX;
    const initialWidth = width;
    
    // Set dragging state
    setIsDragging(true);
    
    // Define move handler
    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const currentX = 'touches' in moveEvent 
        ? moveEvent.touches[0].clientX 
        : (moveEvent as MouseEvent).clientX;
      
      // Calculate delta - for sidebar drag, we move the opposite direction of cursor
      const deltaX = initialX - currentX;
      
      // Calculate new width with constraints
      const newWidth = Math.max(250, initialWidth + deltaX);
      const maxWidth = Math.min(Math.floor(window.innerWidth / 2), 800);
      const constrainedWidth = Math.min(newWidth, maxWidth);
      
      setWidth(constrainedWidth);
      onWidthChange?.(constrainedWidth);
      
      moveEvent.preventDefault();
    };
    
    // Define release handler
    const handleRelease = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMove as EventListener);
      document.removeEventListener('touchmove', handleMove as EventListener);
      document.removeEventListener('mouseup', handleRelease);
      document.removeEventListener('touchend', handleRelease);
    };
    
    // Add listeners
    document.addEventListener('mousemove', handleMove as EventListener);
    document.addEventListener('touchmove', handleMove as EventListener, { passive: false });
    document.addEventListener('mouseup', handleRelease);
    document.addEventListener('touchend', handleRelease);
  };
  
  // Clean up any lingering event listeners
  useEffect(() => {
    return () => {
      const noop = () => {};
      document.removeEventListener('mousemove', noop);
      document.removeEventListener('touchmove', noop);
      document.removeEventListener('mouseup', noop);
      document.removeEventListener('touchend', noop);
    };
  }, []);

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
      // Make sure sidebar width doesn't exceed half the window or 800px
      const maxWidth = Math.min(Math.floor(window.innerWidth / 2), 800);
      if (width > maxWidth) {
        setWidth(maxWidth);
        onWidthChange?.(maxWidth);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, onWidthChange]);

  // Store editor instance when mounted
  const handleEditorMount = (editor: any, monaco: any, codeIndex: number) => {
    // Store the editor reference
    editorRefs.current.set(codeIndex, editor);
    
    // Configure editor
    editor.updateOptions({
      overviewRulerBorder: false,
      renderLineHighlight: 'none',
      guides: {
        indentation: true,
        highlightActiveIndentation: false,
        bracketPairs: true
      },
      bracketPairColorization: { enabled: true },
    });
    
    // Add selection change listener to show whitespace on selection
    editor.onDidChangeCursorSelection(() => {
      const selection = editor.getSelection();
      const hasSelection = selection !== null && !selection.isEmpty();
      
      // Show whitespace/guides when text is selected, hide otherwise
      editor.updateOptions({
        renderWhitespace: hasSelection ? 'all' : 'none'
      });
    });
    
    // Set indentation rules for better indentation guides
    monaco.languages.setLanguageConfiguration('typescript', {
      indentationRules: {
        increaseIndentPattern: /{[^}]*$|^\s*\w*\s*\([^)]*$|\[\s*$/,
        decreaseIndentPattern: /^[^{]*}|^[^(]*\)|\]$/
      }
    });
  };

  // When width changes, update editor layouts
  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timer = setTimeout(() => {
      editorRefs.current.forEach(editor => {
        if (editor && typeof editor.layout === 'function') {
          editor.layout();
        }
      });
    }, 100);
    
    return () => clearTimeout(timer);
  }, [width, isExpanded]);

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

  // Handle copy button click
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
      flexShrink: 0, // Prevent sidebar from shrinking
    }}>
      {/* Resize handle */}
      {isExpanded && (
        <div
          ref={resizeHandleRef}
          className="resize-handle"
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
          style={{
            position: 'absolute',
            left: '-6px',
            top: 0,
            bottom: 0,
            width: '12px',
            cursor: 'col-resize',
            zIndex: 100,
            background: 'transparent',
          }}
        />
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
            gap: '20px', // Increased gap between messages
          }}>
            {messages.map((message, index) => (
              <div 
                key={index} 
                style={{ 
                  alignSelf: message.type === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: message.content.includes('```') ? '100%' : '80%', // Full width for code blocks
                  width: message.content.includes('```') ? '100%' : 'auto', // Full width for code blocks
                  padding: message.content.includes('```') ? '10px 5px' : '10px 15px', // Less side padding for code
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
                          <div key={i} style={{ 
                            position: 'relative',
                            marginTop: '10px',
                            marginBottom: '10px',
                            width: '100%'
                          }}>
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
                                    fontSize: '12px',
                                    padding: '4px 10px',
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
                                    fontSize: '12px',
                                    padding: '4px 10px',
                                    cursor: 'pointer',
                                    fontWeight: 'bold',
                                  }}
                                >
                                  Use
                                </button>
                              </div>
                            )}
                            <div style={{ 
                              background: colors.codeBackground, 
                              borderRadius: '6px', 
                              overflow: 'hidden',
                              fontSize: '13px',
                              margin: '0 auto', // Center the editor horizontally
                              color: colors.foreground,
                              // Make width fully responsive to the container
                              width: '100%',
                              // No max-width constraint to allow full expansion
                              // Calculate height more generously based on code size
                              height: `${Math.min(500, Math.max(150, 
                                // More dynamic height calculation for all window sizes
                                (part.split('\n').length * 22) + 40
                              ))}px`,
                              // Add subtle shadow for better visual distinction
                              boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                            }}>
                              <Editor
                                height="100%"
                                defaultLanguage="typescript"
                                value={part}
                                theme={colors.isDark ? 'vs-dark' : 'light'}
                                options={{
                                  readOnly: true,
                                  minimap: { enabled: false },
                                  fontSize: 14, // Larger font size
                                  wordWrap: 'on',
                                  lineNumbers: 'on',
                                  lineNumbersMinChars: 3,
                                  folding: false,
                                  padding: { top: 10, bottom: 10 }, // More padding
                                  lineDecorationsWidth: 30, // More space between line numbers and code
                                  tabSize: 2,
                                  scrollBeyondLastLine: false,
                                  renderWhitespace: 'none',
                                  guides: { indentation: false },
                                  domReadOnly: true,
                                  contextmenu: false
                                }}
                                onMount={(editor, monaco) => {
                                  handleEditorMount(editor, monaco, codeIndex);
                                }}
                              />
                            </div>
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
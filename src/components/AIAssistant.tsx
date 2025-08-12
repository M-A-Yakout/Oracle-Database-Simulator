import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, ChevronRight, Bot, Lightbulb, AlertTriangle, Info, Zap } from 'lucide-react';
import { OfflineAIHelper } from '../utils/aiHelper';

interface AIAssistantProps {
  currentQuery?: string;
  lastError?: string;
  onSuggestionClick?: (suggestion: string) => void;
}

interface ChatMessage {
  type: 'user' | 'ai';
  content: string;
  timestamp: Date;
  category?: 'suggestion' | 'explanation' | 'optimization' | 'error' | 'guidance';
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ 
  currentQuery = '', 
  lastError = '', 
  onSuggestionClick 
}) => {
  const [activeTab, setActiveTab] = useState('chat');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      type: 'ai',
      content: 'Hello! I\'m your Oracle SQL assistant. I can help you with queries, syntax, optimization, and troubleshooting. What would you like to know?',
      timestamp: new Date(),
      category: 'guidance'
    }
  ]);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const aiHelper = OfflineAIHelper.getInstance();

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  useEffect(() => {
    if (lastError) {
      const errorHelp = aiHelper.getErrorHelp(lastError);
      if (errorHelp) {
        setChatHistory(prev => [...prev, {
          type: 'ai',
          content: `I noticed an error: ${errorHelp.content}`,
          timestamp: new Date(),
          category: 'error'
        }]);
      }
    }
  }, [lastError]);

  const handleChatSubmit = () => {
    if (!chatInput.trim()) return;

    const userMessage: ChatMessage = {
      type: 'user',
      content: chatInput,
      timestamp: new Date()
    };

    setChatHistory(prev => [...prev, userMessage]);

    // Process user input and generate AI response
    const response = generateAIResponse(chatInput);
    const aiMessage: ChatMessage = {
      type: 'ai',
      content: response.content,
      timestamp: new Date(),
      category: response.type
    };

    setChatHistory(prev => [...prev, aiMessage]);
    setChatInput('');
  };

  const generateAIResponse = (userInput: string): { content: string; type: 'suggestion' | 'explanation' | 'optimization' | 'error' | 'guidance' } => {
    const input = userInput.toLowerCase();

    // Help with specific topics
    if (input.includes('select') || input.includes('query')) {
      return {
        content: 'SELECT statements retrieve data from tables. Basic syntax:\n\nSELECT column1, column2 FROM table_name WHERE condition;\n\nFor Oracle-specific queries, you can also use:\nSELECT SYSDATE FROM DUAL; -- Current date\nSELECT USER FROM DUAL; -- Current user',
        type: 'explanation'
      };
    }

    if (input.includes('create') || input.includes('table')) {
      return {
        content: 'CREATE TABLE creates a new table. Oracle syntax:\n\nCREATE TABLE employees (\n  id NUMBER PRIMARY KEY,\n  name VARCHAR2(100) NOT NULL,\n  salary NUMBER(10,2),\n  hire_date DATE DEFAULT SYSDATE\n);\n\nCommon Oracle data types: NUMBER, VARCHAR2, DATE, TIMESTAMP, CLOB, BLOB',
        type: 'explanation'
      };
    }

    if (input.includes('index') || input.includes('performance')) {
      return {
        content: 'Indexes improve query performance:\n\nCREATE INDEX idx_emp_name ON employees(name);\n\nTips:\n• Index frequently queried columns\n• Avoid over-indexing (slows INSERT/UPDATE)\n• Use composite indexes for multi-column queries\n• Monitor index usage with EXPLAIN PLAN',
        type: 'optimization'
      };
    }

    if (input.includes('error') || input.includes('ora-')) {
      return {
        content: 'Common Oracle errors:\n\n• ORA-00942: Table/view does not exist\n• ORA-00904: Invalid column name\n• ORA-00936: Missing expression\n• ORA-00001: Unique constraint violation\n\nAlways check spelling and verify objects exist using DESCRIBE or SELECT from USER_TABLES.',
        type: 'error'
      };
    }

    if (input.includes('best practice') || input.includes('tips')) {
      return {
        content: 'Oracle SQL Best Practices:\n\n• Use specific column names instead of SELECT *\n• Always use WHERE clauses to limit results\n• Use bind variables to prevent SQL injection\n• Add appropriate indexes for query performance\n• Use meaningful table and column names\n• Test queries on sample data first',
        type: 'guidance'
      };
    }

    // Default response
    return {
      content: 'I can help you with Oracle SQL queries, syntax, performance optimization, and troubleshooting. Try asking about:\n\n• SQL syntax (SELECT, INSERT, UPDATE, DELETE, CREATE)\n• Oracle-specific features (DUAL, SYSDATE, ROWNUM)\n• Performance optimization and indexing\n• Common errors and solutions\n• Best practices for database design',
      type: 'guidance'
    };
  };

  const getIconForCategory = (category?: string) => {
    switch (category) {
      case 'suggestion': return <Lightbulb className="w-4 h-4 text-blue-500" />;
      case 'optimization': return <Zap className="w-4 h-4 text-green-500" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'guidance': return <Info className="w-4 h-4 text-purple-500" />;
      default: return <Bot className="w-4 h-4 text-gray-500" />;
    }
  };

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const helpTopics = aiHelper.getHelpTopics();
  const currentQueryAnalysis = currentQuery ? aiHelper.analyzeQuery(currentQuery) : [];

  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-blue-600" />
          <h2 className="text-xl font-bold">AI Assistant</h2>
          <Badge variant="outline" className="text-xs">Offline</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Intelligent help for Oracle SQL queries and database operations
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="px-4 pt-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="analysis">Analysis</TabsTrigger>
            <TabsTrigger value="help">Help Topics</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="chat" className="flex-1 flex flex-col m-0 p-4">
          <ScrollArea className="flex-1 mb-4">
            <div className="space-y-4">
              {chatHistory.map((message, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.type === 'ai' && (
                    <div className="flex-shrink-0">
                      {getIconForCategory(message.category)}
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] p-3 rounded-lg ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-muted border'
                    }`}
                  >
                    <div className="text-sm whitespace-pre-line">
                      {message.content}
                    </div>
                    <div className="text-xs opacity-70 mt-1">
                      {message.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about SQL syntax, optimization, or troubleshooting..."
              onKeyPress={(e) => e.key === 'Enter' && handleChatSubmit()}
            />
            <Button onClick={handleChatSubmit} disabled={!chatInput.trim()}>
              Send
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="flex-1 m-0 p-4">
          <ScrollArea className="h-full">
            <div className="space-y-4">
              {currentQuery ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Current Query Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-muted p-2 rounded font-mono text-sm mb-3">
                        {currentQuery}
                      </div>
                      {currentQueryAnalysis.length > 0 ? (
                        <div className="space-y-2">
                          {currentQueryAnalysis.map((analysis, index) => (
                            <div key={index} className="flex gap-2 p-2 border rounded">
                              {getIconForCategory(analysis.type)}
                              <div className="flex-1">
                                <div className="text-sm">{analysis.content}</div>
                                {analysis.example && (
                                  <div className="text-xs bg-muted p-1 rounded mt-1 font-mono">
                                    {analysis.example}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground">No specific suggestions for this query.</p>
                      )}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Quick Improvements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start text-xs"
                          onClick={() => onSuggestionClick?.('EXPLAIN PLAN FOR ' + currentQuery)}
                        >
                          <Zap className="w-3 h-3 mr-2" />
                          Show Execution Plan
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="w-full justify-start text-xs"
                          onClick={() => onSuggestionClick?.('SELECT COUNT(*) FROM (' + currentQuery + ')')}
                        >
                          <Info className="w-3 h-3 mr-2" />
                          Count Results
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card>
                  <CardContent className="text-center py-8">
                    <Bot className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground">
                      Start typing a query in the terminal to see intelligent analysis and suggestions.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="help" className="flex-1 m-0 p-4">
          <ScrollArea className="h-full">
            <div className="space-y-2">
              {helpTopics.map((category) => (
                <Collapsible 
                  key={category.category}
                  open={openSections[category.category]}
                  onOpenChange={() => toggleSection(category.category)}
                >
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between">
                      <span className="font-medium">{category.category}</span>
                      {openSections[category.category] ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1 ml-4">
                    {category.topics.map((topic) => (
                      <Button
                        key={topic}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start text-xs text-muted-foreground"
                        onClick={() => {
                          setChatInput(`Tell me about ${topic}`);
                          setActiveTab('chat');
                        }}
                      >
                        {topic}
                      </Button>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};
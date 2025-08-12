import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { OracleParser } from '../utils/oracleParser';
import { SessionManager } from '../utils/sessionManager';
import { QueryResult } from '../types/oracle';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'system';
  content: string;
  timestamp: Date;
  result?: QueryResult;
}

export const SqlTerminal: React.FC = () => {
  const [lines, setLines] = useState<TerminalLine[]>([
    {
      type: 'system',
      content: 'Oracle Database Simulator 21c Enterprise Edition Release 21.0.0.0.0\nConnected to Oracle Database Simulator',
      timestamp: new Date()
    },
    {
      type: 'system',
      content: 'SQL*Plus: Release 21.0.0.0.0 - Simulator Version',
      timestamp: new Date()
    }
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [multiLineInput, setMultiLineInput] = useState('');
  const [isMultiLine, setIsMultiLine] = useState(false);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const parser = OracleParser.getInstance();
  const sessionManager = SessionManager.getInstance();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const addLine = (type: TerminalLine['type'], content: string, result?: QueryResult) => {
    setLines(prev => [...prev, { type, content, timestamp: new Date(), result }]);
  };

  const executeCommand = async (command: string) => {
    const fullCommand = isMultiLine ? multiLineInput + '\n' + command : command;
    const trimmedCommand = fullCommand.trim();
    
    if (!trimmedCommand) return;

    setIsExecuting(true);
    addLine('input', `SQL> ${fullCommand}`);

    // Check if it's a session command
    if (trimmedCommand.toUpperCase().startsWith('COMMIT') || 
        trimmedCommand.toUpperCase().startsWith('ROLLBACK') ||
        trimmedCommand.toUpperCase().startsWith('SAVEPOINT') ||
        trimmedCommand.toUpperCase().startsWith('SET') ||
        trimmedCommand.toUpperCase().startsWith('SHOW')) {
      
      const result = sessionManager.executeSessionCommand(trimmedCommand);
      addLine('system', result);
      setIsExecuting(false);
      return;
    }

    // Special commands
    if (trimmedCommand.toUpperCase() === 'CLEAR' || trimmedCommand.toUpperCase() === 'CLS') {
      setLines([]);
      setIsExecuting(false);
      return;
    }

    if (trimmedCommand.toUpperCase() === 'HELP') {
      addLine('system', getHelpText());
      setIsExecuting(false);
      return;
    }

    if (trimmedCommand.toUpperCase() === 'EXIT' || trimmedCommand.toUpperCase() === 'QUIT') {
      addLine('system', 'Disconnected from Oracle Database Simulator');
      setIsExecuting(false);
      return;
    }

    // Check for multi-line SQL (ends with semicolon or slash)
    if (!trimmedCommand.endsWith(';') && !trimmedCommand.endsWith('/')) {
      setIsMultiLine(true);
      setMultiLineInput(fullCommand);
      setIsExecuting(false);
      return;
    }

    // Execute SQL command
    try {
      const result = parser.parseSQL(trimmedCommand);
      
      if (result.success) {
        if (result.data && result.columns) {
          // Display table results
          addLine('output', formatTableResult(result), result);
        } else {
          addLine('system', result.message || 'Command completed successfully.');
        }
        
        if (result.executionPlan) {
          addLine('system', formatExecutionPlan(result.executionPlan));
        }
      } else {
        addLine('error', result.error || 'Unknown error occurred');
      }
    } catch (error) {
      addLine('error', `ORA-00600: internal error code: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Add to command history
    if (!commandHistory.includes(trimmedCommand)) {
      setCommandHistory(prev => [...prev, trimmedCommand].slice(-50)); // Keep last 50 commands
    }

    setIsMultiLine(false);
    setMultiLineInput('');
    setIsExecuting(false);
  };

  const formatTableResult = (result: QueryResult): string => {
    if (!result.data || !result.columns) return '';

    const columns = result.columns;
    const data = result.data;

    // Calculate column widths
    const widths = columns.map(col => {
      const maxDataWidth = Math.max(...data.map(row => String(row[col] || '').length));
      return Math.max(col.length, maxDataWidth, 10);
    });

    // Create header
    let output = '\n';
    const headerLine = columns.map((col, i) => col.padEnd(widths[i])).join(' ');
    const separatorLine = columns.map((_, i) => '-'.repeat(widths[i])).join(' ');
    
    output += headerLine + '\n';
    output += separatorLine + '\n';

    // Add data rows
    data.forEach(row => {
      const dataLine = columns.map((col, i) => {
        const value = row[col] !== undefined ? String(row[col]) : '';
        return value.padEnd(widths[i]);
      }).join(' ');
      output += dataLine + '\n';
    });

    output += `\n${data.length} row${data.length !== 1 ? 's' : ''} selected.\n`;
    
    if (result.executionTime !== undefined) {
      output += `\nElapsed: ${result.executionTime} ms\n`;
    }

    return output;
  };

  const formatExecutionPlan = (plan: ExecutionPlan): string => {
    return `\nExecution Plan:\n----------------------------------------------------------\n` +
           `Plan hash value: ${Math.floor(Math.random() * 1000000000)}\n\n` +
           `| Operation         | Name     | Rows  | Bytes | Cost  | Time     |\n` +
           `|-------------------|----------|-------|-------|-------|----------|\n` +
           `| ${plan.operation.padEnd(17)} | ${plan.object.padEnd(8)} | ${String(plan.cardinality).padEnd(5)} | ${String(plan.bytes).padEnd(5)} | ${String(plan.cost).padEnd(5)} | ${plan.time.padEnd(8)} |\n\n`;
  };

  const getHelpText = (): string => {
    return `\nOracle Database Simulator - Available Commands:\n\n` +
           `SQL Commands:\n` +
           `  CREATE TABLE table_name (column_name datatype, ...)\n` +
           `  INSERT INTO table_name VALUES (value1, value2, ...)\n` +
           `  SELECT * FROM table_name [WHERE condition]\n` +
           `  UPDATE table_name SET column=value [WHERE condition]\n` +
           `  DELETE FROM table_name [WHERE condition]\n` +
           `  DROP TABLE table_name\n` +
           `  CREATE INDEX index_name ON table_name (column)\n` +
           `  DESC[RIBE] table_name\n\n` +
           `Session Commands:\n` +
           `  COMMIT - Commit current transaction\n` +
           `  ROLLBACK - Rollback current transaction\n` +
           `  SAVEPOINT name - Create savepoint\n` +
           `  SET AUTOCOMMIT {ON|OFF}\n` +
           `  SET PAGESIZE number\n` +
           `  SHOW USER\n` +
           `  SHOW AUTOCOMMIT\n\n` +
           `Utility Commands:\n` +
           `  CLEAR/CLS - Clear screen\n` +
           `  HELP - Show this help\n` +
           `  EXIT/QUIT - Exit simulator\n\n` +
           `Oracle Data Types Supported:\n` +
           `  VARCHAR2(size), NUMBER(p,s), DATE, TIMESTAMP\n`;
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      executeCommand(currentInput);
      setCurrentInput('');
      setHistoryIndex(-1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentInput('');
      }
    }
  };

  const renderLine = (line: TerminalLine, index: number) => {
    const baseClass = "font-mono text-sm whitespace-pre-wrap";
    
    switch (line.type) {
      case 'input':
        return (
          <div key={index} className={`${baseClass} text-blue-300`}>
            {line.content}
          </div>
        );
      case 'output':
        return (
          <div key={index} className={`${baseClass} text-green-300`}>
            {line.content}
          </div>
        );
      case 'error':
        return (
          <div key={index} className={`${baseClass} text-red-300`}>
            {line.content}
          </div>
        );
      case 'system':
        return (
          <div key={index} className={`${baseClass} text-yellow-300`}>
            {line.content}
          </div>
        );
      default:
        return (
          <div key={index} className={`${baseClass} text-white`}>
            {line.content}
          </div>
        );
    }
  };

  return (
    <div className="h-full flex flex-col bg-black text-white">
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-lg font-bold text-orange-400">Oracle Database Simulator</h1>
          <Badge variant="secondary" className="bg-green-700 text-green-100">
            Connected
          </Badge>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => {
              parser.clearAll();
              setLines([
                {
                  type: 'system',
                  content: 'Oracle Database Simulator 21c Enterprise Edition Release 21.0.0.0.0\nConnected to Oracle Database Simulator',
                  timestamp: new Date()
                }
              ]);
            }}
            className="text-xs"
          >
            Clear DB
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => addLine('system', getHelpText())}
            className="text-xs"
          >
            Help
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-1">
          {lines.map((line, index) => renderLine(line, index))}
          
          {isExecuting && (
            <div className="font-mono text-sm text-yellow-300 animate-pulse">
              Executing...
            </div>
          )}
          
          <div className="flex items-center font-mono text-sm">
            <span className="text-blue-300 mr-2">
              {isMultiLine ? '  2  ' : 'SQL>'}
            </span>
            <input
              ref={inputRef}
              type="text"
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-white"
              placeholder={isMultiLine ? "Continue SQL statement..." : "Enter SQL command or type HELP"}
              disabled={isExecuting}
            />
          </div>
        </div>
      </ScrollArea>
      
      <div className="p-2 bg-gray-800 border-t border-gray-700 text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Session: {sessionManager.getSession().currentSchema}</span>
          <span>AutoCommit: {sessionManager.getSession().autoCommit ? 'ON' : 'OFF'}</span>
          <span>Transaction: {sessionManager.isTransactionActive() ? 'ACTIVE' : 'INACTIVE'}</span>
        </div>
      </div>
    </div>
  );
};
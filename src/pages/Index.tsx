import React, { useState, useRef } from 'react';
import { SqlTerminal } from '../components/SqlTerminal';
import { SchemaViewer } from '../components/SchemaViewer';
import { QueryBuilder } from '../components/QueryBuilder';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

export default function Index() {
  const [activeTab, setActiveTab] = useState('terminal');
  const terminalRef = useRef<HTMLDivElement>(null);

  const handleExecuteQuery = (query: string) => {
    setActiveTab('terminal');
    // This would need to be implemented to send the query to the terminal
    // For now, we'll just switch to the terminal tab
  };

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="border-b bg-muted/50 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-orange-600">Oracle Database Simulator</h1>
            <p className="text-sm text-muted-foreground">
              Enterprise Edition Release 21.0.0.0.0 - Web Interface
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="text-sm text-muted-foreground">Connected</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        <ResizablePanelGroup direction="horizontal">
          {/* Left Panel - Schema Browser */}
          <ResizablePanel defaultSize={25} minSize={20}>
            <SchemaViewer />
          </ResizablePanel>
          
          <ResizableHandle withHandle />
          
          {/* Right Panel - Main Interface */}
          <ResizablePanel defaultSize={75}>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
              <div className="border-b px-4">
                <TabsList className="grid w-full max-w-md grid-cols-2">
                  <TabsTrigger value="terminal">SQL Terminal</TabsTrigger>
                  <TabsTrigger value="builder">Query Builder</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="terminal" className="flex-1 m-0">
                <SqlTerminal ref={terminalRef} />
              </TabsContent>
              
              <TabsContent value="builder" className="flex-1 m-0">
                <QueryBuilder onExecuteQuery={handleExecuteQuery} />
              </TabsContent>
            </Tabs>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>

      {/* Footer */}
      <div className="border-t bg-muted/50 px-4 py-2">
        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>Oracle Database Simulator - Educational Use Only</span>
          <span>M.Mostafa © 2025</span>
        </div>
      </div>
    </div>
  );
}
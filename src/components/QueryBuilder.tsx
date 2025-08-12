import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { OracleParser } from '../utils/oracleParser';

interface QueryBuilderProps {
  onExecuteQuery: (query: string) => void;
}

export const QueryBuilder: React.FC<QueryBuilderProps> = ({ onExecuteQuery }) => {
  const [queryType, setQueryType] = useState<'select' | 'insert' | 'update' | 'delete' | 'create'>('select');
  const [selectedTable, setSelectedTable] = useState('');
  const [columns, setColumns] = useState<string[]>([]);
  const [whereClause, setWhereClause] = useState('');
  const [customQuery, setCustomQuery] = useState('');
  
  const parser = OracleParser.getInstance();
  const tables = Array.from(parser.getTables().keys());

  const generateSelectQuery = () => {
    if (!selectedTable) return '';
    
    const columnList = columns.length > 0 ? columns.join(', ') : '*';
    let query = `SELECT ${columnList} FROM ${selectedTable}`;
    
    if (whereClause.trim()) {
      query += ` WHERE ${whereClause}`;
    }
    
    return query + ';';
  };

  const generateInsertQuery = () => {
    if (!selectedTable) return '';
    
    const table = parser.getTables().get(selectedTable);
    if (!table) return '';
    
    const columnNames = table.columns.map(col => col.name).join(', ');
    const placeholders = table.columns.map(() => '?').join(', ');
    
    return `INSERT INTO ${selectedTable} (${columnNames}) VALUES (${placeholders});`;
  };

  const generateUpdateQuery = () => {
    if (!selectedTable) return '';
    
    let query = `UPDATE ${selectedTable} SET column_name = value`;
    
    if (whereClause.trim()) {
      query += ` WHERE ${whereClause}`;
    }
    
    return query + ';';
  };

  const generateDeleteQuery = () => {
    if (!selectedTable) return '';
    
    let query = `DELETE FROM ${selectedTable}`;
    
    if (whereClause.trim()) {
      query += ` WHERE ${whereClause}`;
    }
    
    return query + ';';
  };

  const generateCreateTableQuery = () => {
    return `CREATE TABLE new_table (
  id NUMBER PRIMARY KEY,
  name VARCHAR2(100) NOT NULL,
  created_date DATE DEFAULT SYSDATE
);`;
  };

  const getCurrentQuery = () => {
    switch (queryType) {
      case 'select':
        return generateSelectQuery();
      case 'insert':
        return generateInsertQuery();
      case 'update':
        return generateUpdateQuery();
      case 'delete':
        return generateDeleteQuery();
      case 'create':
        return generateCreateTableQuery();
      default:
        return '';
    }
  };

  const handleTableChange = (tableName: string) => {
    setSelectedTable(tableName);
    const table = parser.getTables().get(tableName);
    if (table) {
      setColumns([]);
    }
  };

  const getTableColumns = (tableName: string) => {
    const table = parser.getTables().get(tableName);
    return table ? table.columns.map(col => col.name) : [];
  };

  const handleColumnToggle = (columnName: string) => {
    setColumns(prev => 
      prev.includes(columnName) 
        ? prev.filter(col => col !== columnName)
        : [...prev, columnName]
    );
  };

  const quickQueries = [
    {
      name: "Show All Tables",
      query: "SELECT table_name FROM user_tables;"
    },
    {
      name: "Current User",
      query: "SELECT USER FROM DUAL;"
    },
    {
      name: "Current Date",
      query: "SELECT SYSDATE FROM DUAL;"
    },
    {
      name: "System Time",
      query: "SELECT SYSTIMESTAMP FROM DUAL;"
    }
  ];

  return (
    <div className="h-full overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Query Builder</h2>
        <p className="text-sm text-muted-foreground">
          Build and execute SQL queries with visual assistance
        </p>
      </div>

      <div className="flex-1 overflow-auto p-4">
        <Tabs value={queryType} onValueChange={(value) => setQueryType(value as 'select' | 'insert' | 'update' | 'delete' | 'create')} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="select">SELECT</TabsTrigger>
            <TabsTrigger value="insert">INSERT</TabsTrigger>
            <TabsTrigger value="update">UPDATE</TabsTrigger>
            <TabsTrigger value="delete">DELETE</TabsTrigger>
            <TabsTrigger value="create">CREATE</TabsTrigger>
          </TabsList>

          <TabsContent value="select" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SELECT Query Builder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="table-select">Table</Label>
                  <Select value={selectedTable} onValueChange={handleTableChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map(table => (
                        <SelectItem key={table} value={table}>{table}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTable && (
                  <div>
                    <Label>Columns</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Badge 
                        variant={columns.length === 0 ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => setColumns([])}
                      >
                        * (All)
                      </Badge>
                      {getTableColumns(selectedTable).map(column => (
                        <Badge
                          key={column}
                          variant={columns.includes(column) ? "default" : "outline"}
                          className="cursor-pointer"
                          onClick={() => handleColumnToggle(column)}
                        >
                          {column}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="where-clause">WHERE Clause (optional)</Label>
                  <Input
                    id="where-clause"
                    value={whereClause}
                    onChange={(e) => setWhereClause(e.target.value)}
                    placeholder="e.g., id = 1 AND name = 'John'"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insert" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">INSERT Query Builder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Table</Label>
                  <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map(table => (
                        <SelectItem key={table} value={table}>{table}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="update" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">UPDATE Query Builder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Table</Label>
                  <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map(table => (
                        <SelectItem key={table} value={table}>{table}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="where-update">WHERE Clause</Label>
                  <Input
                    id="where-update"
                    value={whereClause}
                    onChange={(e) => setWhereClause(e.target.value)}
                    placeholder="e.g., id = 1"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="delete" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">DELETE Query Builder</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Table</Label>
                  <Select value={selectedTable} onValueChange={setSelectedTable}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a table" />
                    </SelectTrigger>
                    <SelectContent>
                      {tables.map(table => (
                        <SelectItem key={table} value={table}>{table}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="where-delete">WHERE Clause (optional)</Label>
                  <Input
                    id="where-delete"
                    value={whereClause}
                    onChange={(e) => setWhereClause(e.target.value)}
                    placeholder="e.g., id = 1 (leave empty to delete all rows)"
                  />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="create" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">CREATE TABLE Query Builder</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Use the generated template below or modify as needed:
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Generated Query Preview */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Generated Query</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={getCurrentQuery()}
              readOnly
              className="font-mono text-sm min-h-[100px]"
              placeholder="Configure the query builder above to generate SQL"
            />
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(getCurrentQuery());
                }}
                disabled={!getCurrentQuery()}
              >
                Copy Query
              </Button>
              <Button
                onClick={() => onExecuteQuery(getCurrentQuery())}
                disabled={!getCurrentQuery()}
              >
                Execute Query
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Queries */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Quick Queries</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {quickQueries.map((query, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => onExecuteQuery(query.query)}
                  className="text-xs"
                >
                  {query.name}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Custom Query */}
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="text-sm">Custom Query</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={customQuery}
              onChange={(e) => setCustomQuery(e.target.value)}
              className="font-mono text-sm min-h-[100px]"
              placeholder="Enter your custom SQL query here..."
            />
            <Button
              className="mt-4"
              onClick={() => onExecuteQuery(customQuery)}
              disabled={!customQuery.trim()}
            >
              Execute Custom Query
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
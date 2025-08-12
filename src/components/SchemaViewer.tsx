import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { OracleParser } from '../utils/oracleParser';
import { OracleTable } from '../types/oracle';

export const SchemaViewer: React.FC = () => {
  const parser = OracleParser.getInstance();
  const tables = Array.from(parser.getTables().values());

  const renderTableStructure = (table: OracleTable) => (
    <Card key={table.name} className="mb-4">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{table.name}</CardTitle>
          <div className="flex space-x-2">
            <Badge variant="secondary">{table.data.length} rows</Badge>
            <Badge variant="outline">{table.columns.length} columns</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="structure" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="structure">Structure</TabsTrigger>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="indexes">Indexes</TabsTrigger>
            <TabsTrigger value="constraints">Constraints</TabsTrigger>
          </TabsList>
          
          <TabsContent value="structure" className="mt-4">
            <ScrollArea className="h-64">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Column Name</TableHead>
                    <TableHead>Data Type</TableHead>
                    <TableHead>Nullable</TableHead>
                    <TableHead>Default</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {table.columns.map((column, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{column.name}</TableCell>
                      <TableCell>{column.dataType}</TableCell>
                      <TableCell>
                        <Badge variant={column.nullable ? "secondary" : "destructive"}>
                          {column.nullable ? "YES" : "NO"}
                        </Badge>
                      </TableCell>
                      <TableCell>{column.defaultValue || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="data" className="mt-4">
            <ScrollArea className="h-64">
              {table.data.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {table.columns.map((column, index) => (
                        <TableHead key={index}>{column.name}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.data.slice(0, 10).map((row, rowIndex) => (
                      <TableRow key={rowIndex}>
                        {table.columns.map((column, colIndex) => (
                          <TableCell key={colIndex}>
                            {row[column.name] !== undefined ? String(row[column.name]) : '-'}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No data available
                </div>
              )}
              {table.data.length > 10 && (
                <div className="text-xs text-muted-foreground mt-2">
                  Showing first 10 rows of {table.data.length} total rows
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="indexes" className="mt-4">
            <ScrollArea className="h-64">
              {table.indexes.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Index Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Unique</TableHead>
                      <TableHead>Columns</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.indexes.map((index, indexIndex) => (
                      <TableRow key={indexIndex}>
                        <TableCell className="font-medium">{index.name}</TableCell>
                        <TableCell>{index.type}</TableCell>
                        <TableCell>
                          <Badge variant={index.unique ? "default" : "secondary"}>
                            {index.unique ? "UNIQUE" : "NON-UNIQUE"}
                          </Badge>
                        </TableCell>
                        <TableCell>{index.columns.join(', ')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No indexes defined
                </div>
              )}
            </ScrollArea>
          </TabsContent>
          
          <TabsContent value="constraints" className="mt-4">
            <ScrollArea className="h-64">
              {table.constraints.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Constraint Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Columns</TableHead>
                      <TableHead>Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {table.constraints.map((constraint, constraintIndex) => (
                      <TableRow key={constraintIndex}>
                        <TableCell className="font-medium">{constraint.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{constraint.type}</Badge>
                        </TableCell>
                        <TableCell>{constraint.columns.join(', ')}</TableCell>
                        <TableCell>
                          {constraint.referencedTable ? 
                            `${constraint.referencedTable}(${constraint.referencedColumns?.join(', ')})` : 
                            '-'
                          }
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  No constraints defined
                </div>
              )}
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-full overflow-hidden">
      <div className="p-4 border-b">
        <h2 className="text-xl font-bold">Database Schema</h2>
        <p className="text-sm text-muted-foreground">
          Current schema: ORACLE_SIM ({tables.length} table{tables.length !== 1 ? 's' : ''})
        </p>
      </div>
      
      <ScrollArea className="flex-1 p-4">
        {tables.length > 0 ? (
          <div className="space-y-4">
            {tables.map(renderTableStructure)}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="text-muted-foreground mb-4">
              <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 1.79 4 4 4h8c2.21 0 4-1.79 4-4V7c0-2.21-1.79-4-4-4H8c-2.21 0-4 1.79-4 4z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7h16" />
              </svg>
              <h3 className="text-lg font-medium">No Tables Found</h3>
              <p className="text-sm">Create your first table using SQL commands in the terminal.</p>
            </div>
            <div className="text-xs text-muted-foreground space-y-1">
              <p>Example:</p>
              <code className="bg-muted px-2 py-1 rounded">
                CREATE TABLE employees (id NUMBER, name VARCHAR2(100));
              </code>
            </div>
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
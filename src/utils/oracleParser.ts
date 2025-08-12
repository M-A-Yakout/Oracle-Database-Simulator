import { OracleTable, OracleColumn, QueryResult, ExecutionPlan, OracleError } from '../types/oracle';

export class OracleParser {
  private static instance: OracleParser;
  private tables: Map<string, OracleTable> = new Map();
  private sequences: Map<string, number> = new Map();

  static getInstance(): OracleParser {
    if (!OracleParser.instance) {
      OracleParser.instance = new OracleParser();
    }
    return OracleParser.instance;
  }

  parseSQL(sql: string): QueryResult {
    try {
      const cleanSQL = sql.trim().replace(/;$/, '');
      const startTime = performance.now();
      
      // Convert Oracle syntax to standard SQL
      const normalizedSQL = this.normalizeOracleSQL(cleanSQL);
      
      let result: QueryResult;
      
      if (normalizedSQL.toUpperCase().startsWith('SELECT')) {
        result = this.executeSelect(normalizedSQL);
      } else if (normalizedSQL.toUpperCase().startsWith('CREATE TABLE')) {
        result = this.executeCreateTable(normalizedSQL);
      } else if (normalizedSQL.toUpperCase().startsWith('INSERT')) {
        result = this.executeInsert(normalizedSQL);
      } else if (normalizedSQL.toUpperCase().startsWith('UPDATE')) {
        result = this.executeUpdate(normalizedSQL);
      } else if (normalizedSQL.toUpperCase().startsWith('DELETE')) {
        result = this.executeDelete(normalizedSQL);
      } else if (normalizedSQL.toUpperCase().startsWith('DROP TABLE')) {
        result = this.executeDropTable(normalizedSQL);
      } else if (normalizedSQL.toUpperCase().startsWith('CREATE INDEX')) {
        result = this.executeCreateIndex(normalizedSQL);
      } else if (normalizedSQL.toUpperCase().startsWith('DESCRIBE') || normalizedSQL.toUpperCase().startsWith('DESC')) {
        result = this.executeDescribe(normalizedSQL);
      } else if (normalizedSQL.toUpperCase().includes('DUAL')) {
        result = this.executeDualQuery(normalizedSQL);
      } else {
        result = {
          success: false,
          error: 'ORA-00900: invalid SQL statement'
        };
      }

      const endTime = performance.now();
      result.executionTime = Math.round((endTime - startTime) * 1000) / 1000; // microseconds
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: `ORA-00907: ${error instanceof Error ? error.message : 'Unknown error'}`,
        executionTime: 0
      };
    }
  }

  private normalizeOracleSQL(sql: string): string {
    // Convert Oracle-specific syntax
    return sql
      .replace(/VARCHAR2\((\d+)\)/gi, 'VARCHAR($1)')
      .replace(/NUMBER\((\d+),(\d+)\)/gi, 'DECIMAL($1,$2)')
      .replace(/NUMBER\((\d+)\)/gi, 'INTEGER')
      .replace(/NUMBER/gi, 'DECIMAL(38,10)')
      .replace(/DATE/gi, 'TIMESTAMP')
      .replace(/SYSDATE/gi, 'CURRENT_TIMESTAMP')
      .replace(/SYSTIMESTAMP/gi, 'CURRENT_TIMESTAMP')
      .replace(/NVL\(/gi, 'COALESCE(')
      .replace(/\|\|/g, '+'); // Concatenation operator
  }

  private executeSelect(sql: string): QueryResult {
    // Parse SELECT statement
    const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM\s+(\w+)(?:\s+WHERE\s+(.*))?/i);
    
    if (!selectMatch) {
      return {
        success: false,
        error: 'ORA-00936: missing expression'
      };
    }

    const [, columns, tableName, whereClause] = selectMatch;
    const table = this.tables.get(tableName.toUpperCase());

    if (!table) {
      return {
        success: false,
        error: `ORA-00942: table or view does not exist: ${tableName}`
      };
    }

    let data = [...table.data];
    
    // Apply WHERE clause (simplified)
    if (whereClause) {
      data = data.filter(row => this.evaluateWhereClause(row, whereClause));
    }

    // Select columns
    let resultColumns: string[];
    let resultData: Record<string, unknown>[];

    if (columns.trim() === '*') {
      resultColumns = table.columns.map(col => col.name);
      resultData = data;
    } else {
      resultColumns = columns.split(',').map(col => col.trim());
      resultData = data.map(row => {
        const newRow: Record<string, unknown> = {};
        resultColumns.forEach(col => {
          newRow[col] = row[col];
        });
        return newRow;
      });
    }

    return {
      success: true,
      data: resultData,
      columns: resultColumns,
      rowCount: resultData.length,
      executionPlan: this.generateExecutionPlan('SELECT', tableName, data.length)
    };
  }

  private executeCreateTable(sql: string): QueryResult {
    const match = sql.match(/CREATE\s+TABLE\s+(\w+)\s*\((.*)\)/i);
    
    if (!match) {
      return {
        success: false,
        error: 'ORA-00907: missing right parenthesis'
      };
    }

    const [, tableName, columnDefs] = match;
    const tableNameUpper = tableName.toUpperCase();

    if (this.tables.has(tableNameUpper)) {
      return {
        success: false,
        error: `ORA-00955: name is already used by an existing object: ${tableName}`
      };
    }

    const columns = this.parseColumnDefinitions(columnDefs);
    
    const table: OracleTable = {
      name: tableNameUpper,
      columns,
      data: [],
      indexes: [],
      constraints: [],
      created: new Date()
    };

    this.tables.set(tableNameUpper, table);

    return {
      success: true,
      message: `Table ${tableName} created.`,
      rowCount: 0
    };
  }

  private executeInsert(sql: string): QueryResult {
    const match = sql.match(/INSERT\s+INTO\s+(\w+)\s*(?:\((.*?)\))?\s*VALUES\s*\((.*)\)/i);
    
    if (!match) {
      return {
        success: false,
        error: 'ORA-00936: missing expression'
      };
    }

    const [, tableName, columnList, valueList] = match;
    const table = this.tables.get(tableName.toUpperCase());

    if (!table) {
      return {
        success: false,
        error: `ORA-00942: table or view does not exist: ${tableName}`
      };
    }

    const values = this.parseValues(valueList);
    const columns = columnList ? 
      columnList.split(',').map(col => col.trim()) : 
      table.columns.map(col => col.name);

    const newRow: Record<string, unknown> = {};
    columns.forEach((col, index) => {
      newRow[col] = values[index];
    });

    table.data.push(newRow);

    return {
      success: true,
      message: '1 row created.',
      rowCount: 1
    };
  }

  private executeUpdate(sql: string): QueryResult {
    const match = sql.match(/UPDATE\s+(\w+)\s+SET\s+(.*?)(?:\s+WHERE\s+(.*))?/i);
    
    if (!match) {
      return {
        success: false,
        error: 'ORA-00936: missing expression'
      };
    }

    const [, tableName, setClause, whereClause] = match;
    const table = this.tables.get(tableName.toUpperCase());

    if (!table) {
      return {
        success: false,
        error: `ORA-00942: table or view does not exist: ${tableName}`
      };
    }

    let updatedRows = 0;
    table.data.forEach(row => {
      if (!whereClause || this.evaluateWhereClause(row, whereClause)) {
        this.applySetClause(row, setClause);
        updatedRows++;
      }
    });

    return {
      success: true,
      message: `${updatedRows} row${updatedRows !== 1 ? 's' : ''} updated.`,
      rowCount: updatedRows
    };
  }

  private executeDelete(sql: string): QueryResult {
    const match = sql.match(/DELETE\s+FROM\s+(\w+)(?:\s+WHERE\s+(.*))?/i);
    
    if (!match) {
      return {
        success: false,
        error: 'ORA-00936: missing expression'
      };
    }

    const [, tableName, whereClause] = match;
    const table = this.tables.get(tableName.toUpperCase());

    if (!table) {
      return {
        success: false,
        error: `ORA-00942: table or view does not exist: ${tableName}`
      };
    }

    const initialCount = table.data.length;
    
    if (whereClause) {
      table.data = table.data.filter(row => !this.evaluateWhereClause(row, whereClause));
    } else {
      table.data = [];
    }

    const deletedRows = initialCount - table.data.length;

    return {
      success: true,
      message: `${deletedRows} row${deletedRows !== 1 ? 's' : ''} deleted.`,
      rowCount: deletedRows
    };
  }

  private executeDropTable(sql: string): QueryResult {
    const match = sql.match(/DROP\s+TABLE\s+(\w+)/i);
    
    if (!match) {
      return {
        success: false,
        error: 'ORA-00942: table or view does not exist'
      };
    }

    const tableName = match[1].toUpperCase();
    
    if (!this.tables.has(tableName)) {
      return {
        success: false,
        error: `ORA-00942: table or view does not exist: ${tableName}`
      };
    }

    this.tables.delete(tableName);

    return {
      success: true,
      message: `Table ${tableName} dropped.`,
      rowCount: 0
    };
  }

  private executeCreateIndex(sql: string): QueryResult {
    const match = sql.match(/CREATE\s+(?:UNIQUE\s+)?INDEX\s+(\w+)\s+ON\s+(\w+)\s*\((.*?)\)/i);
    
    if (!match) {
      return {
        success: false,
        error: 'ORA-00907: missing right parenthesis'
      };
    }

    const [, indexName, tableName, columnList] = match;
    const table = this.tables.get(tableName.toUpperCase());

    if (!table) {
      return {
        success: false,
        error: `ORA-00942: table or view does not exist: ${tableName}`
      };
    }

    const columns = columnList.split(',').map(col => col.trim());
    const isUnique = sql.toUpperCase().includes('UNIQUE');

    table.indexes.push({
      name: indexName.toUpperCase(),
      columns,
      unique: isUnique,
      type: 'BTREE'
    });

    return {
      success: true,
      message: `Index ${indexName} created.`,
      rowCount: 0
    };
  }

  private executeDescribe(sql: string): QueryResult {
    const match = sql.match(/DESC(?:RIBE)?\s+(\w+)/i);
    
    if (!match) {
      return {
        success: false,
        error: 'ORA-00942: table or view does not exist'
      };
    }

    const tableName = match[1].toUpperCase();
    const table = this.tables.get(tableName);

    if (!table) {
      return {
        success: false,
        error: `ORA-00942: table or view does not exist: ${tableName}`
      };
    }

    const data = table.columns.map(col => ({
      'Name': col.name,
      'Null?': col.nullable ? '' : 'NOT NULL',
      'Type': col.dataType + (col.length ? `(${col.length})` : '')
    }));

    return {
      success: true,
      data,
      columns: ['Name', 'Null?', 'Type'],
      rowCount: data.length
    };
  }

  private executeDualQuery(sql: string): QueryResult {
    // Handle DUAL table queries for Oracle compatibility
    const selectMatch = sql.match(/SELECT\s+(.*?)\s+FROM\s+DUAL/i);
    
    if (!selectMatch) {
      return {
        success: false,
        error: 'ORA-00936: missing expression'
      };
    }

    const expression = selectMatch[1].trim();
    
    // Evaluate simple expressions
    let result: unknown;
    
    if (expression.toUpperCase() === 'SYSDATE') {
      result = new Date().toISOString().split('T')[0];
    } else if (expression.toUpperCase() === 'SYSTIMESTAMP') {
      result = new Date().toISOString();
    } else if (expression.toUpperCase() === 'USER') {
      result = 'ORACLE_SIM';
    } else if (/^\d+\s*[+\-*/]\s*\d+$/.test(expression)) {
      result = eval(expression);
    } else {
      result = expression.replace(/'/g, '');
    }

    return {
      success: true,
      data: [{ [expression]: result }],
      columns: [expression],
      rowCount: 1
    };
  }

  private parseColumnDefinitions(columnDefs: string): OracleColumn[] {
    const columns: OracleColumn[] = [];
    const defs = columnDefs.split(',');

    defs.forEach(def => {
      const parts = def.trim().split(/\s+/);
      const name = parts[0];
      const dataType = parts[1] || 'VARCHAR2(255)';
      const nullable = !def.toUpperCase().includes('NOT NULL');

      columns.push({
        name: name.toUpperCase(),
        dataType,
        nullable
      });
    });

    return columns;
  }

  private parseValues(valueList: string): unknown[] {
    const values: unknown[] = [];
    const parts = valueList.split(',');

    parts.forEach(value => {
      const trimmed = value.trim();
      if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
        values.push(trimmed.slice(1, -1));
      } else if (!isNaN(Number(trimmed))) {
        values.push(Number(trimmed));
      } else {
        values.push(trimmed);
      }
    });

    return values;
  }

  private evaluateWhereClause(row: Record<string, unknown>, whereClause: string): boolean {
    // Simplified WHERE clause evaluation
    const conditions = whereClause.split(/\s+(AND|OR)\s+/i);
    
    for (let i = 0; i < conditions.length; i += 2) {
      const condition = conditions[i].trim();
      const match = condition.match(/(\w+)\s*(=|!=|<>|<|>|<=|>=)\s*(.+)/);
      
      if (match) {
        const [, column, operator, value] = match;
        const columnValue = row[column.toUpperCase()];
        const compareValue = value.replace(/'/g, '');
        
        let result = false;
        switch (operator) {
          case '=':
            result = columnValue == compareValue;
            break;
          case '!=':
          case '<>':
            result = columnValue != compareValue;
            break;
          case '<':
            result = columnValue < compareValue;
            break;
          case '>':
            result = columnValue > compareValue;
            break;
          case '<=':
            result = columnValue <= compareValue;
            break;
          case '>=':
            result = columnValue >= compareValue;
            break;
        }
        
        if (!result) return false;
      }
    }
    
    return true;
  }

  private applySetClause(row: Record<string, unknown>, setClause: string): void {
    const assignments = setClause.split(',');
    
    assignments.forEach(assignment => {
      const [column, value] = assignment.split('=').map(s => s.trim());
      const cleanValue = value.replace(/'/g, '');
      row[column.toUpperCase()] = cleanValue;
    });
  }

  private generateExecutionPlan(operation: string, object: string, rows: number): ExecutionPlan {
    return {
      operation: `${operation.toUpperCase()} STATEMENT`,
      object: object.toUpperCase(),
      cost: Math.max(1, Math.floor(rows / 100)),
      cardinality: rows,
      bytes: rows * 100,
      time: '00:00:01'
    };
  }

  getTables(): Map<string, OracleTable> {
    return this.tables;
  }

  clearAll(): void {
    this.tables.clear();
    this.sequences.clear();
  }
}
interface AIResponse {
  type: 'suggestion' | 'explanation' | 'optimization' | 'error' | 'guidance';
  content: string;
  example?: string;
  severity?: 'info' | 'warning' | 'error';
}

interface QueryPattern {
  pattern: RegExp;
  suggestions: string[];
  explanation: string;
  examples: string[];
}

export class OfflineAIHelper {
  private static instance: OfflineAIHelper;
  
  private oracleKeywords = [
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP',
    'ALTER', 'TABLE', 'INDEX', 'VIEW', 'SEQUENCE', 'TRIGGER', 'PROCEDURE',
    'FUNCTION', 'PACKAGE', 'CURSOR', 'COMMIT', 'ROLLBACK', 'SAVEPOINT',
    'GRANT', 'REVOKE', 'CONNECT', 'RESOURCE', 'DBA', 'PUBLIC',
    'VARCHAR2', 'NUMBER', 'DATE', 'TIMESTAMP', 'CHAR', 'CLOB', 'BLOB',
    'SYSDATE', 'SYSTIMESTAMP', 'USER', 'DUAL', 'ROWNUM', 'ROWID'
  ];

  private queryPatterns: QueryPattern[] = [
    {
      pattern: /^SELECT\s*$/i,
      suggestions: ['SELECT * FROM table_name', 'SELECT column1, column2 FROM table_name'],
      explanation: 'SELECT statement retrieves data from one or more tables.',
      examples: [
        'SELECT * FROM employees;',
        'SELECT name, salary FROM employees WHERE department = \'IT\';'
      ]
    },
    {
      pattern: /^CREATE\s*$/i,
      suggestions: ['CREATE TABLE table_name', 'CREATE INDEX index_name', 'CREATE VIEW view_name'],
      explanation: 'CREATE statement creates database objects like tables, indexes, or views.',
      examples: [
        'CREATE TABLE employees (id NUMBER, name VARCHAR2(100));',
        'CREATE INDEX idx_emp_name ON employees(name);'
      ]
    },
    {
      pattern: /^INSERT\s*$/i,
      suggestions: ['INSERT INTO table_name VALUES', 'INSERT INTO table_name (columns) VALUES'],
      explanation: 'INSERT statement adds new rows to a table.',
      examples: [
        'INSERT INTO employees VALUES (1, \'John Doe\', 50000);',
        'INSERT INTO employees (id, name) VALUES (2, \'Jane Smith\');'
      ]
    },
    {
      pattern: /^UPDATE\s*$/i,
      suggestions: ['UPDATE table_name SET column = value', 'UPDATE table_name SET column = value WHERE condition'],
      explanation: 'UPDATE statement modifies existing rows in a table.',
      examples: [
        'UPDATE employees SET salary = 55000 WHERE id = 1;',
        'UPDATE employees SET department = \'HR\' WHERE name = \'John Doe\';'
      ]
    },
    {
      pattern: /^DELETE\s*$/i,
      suggestions: ['DELETE FROM table_name', 'DELETE FROM table_name WHERE condition'],
      explanation: 'DELETE statement removes rows from a table.',
      examples: [
        'DELETE FROM employees WHERE id = 1;',
        'DELETE FROM employees WHERE salary < 30000;'
      ]
    }
  ];

  private commonErrors = [
    {
      pattern: /ORA-00942/,
      solution: 'Table or view does not exist. Check table name spelling and ensure the table exists.',
      prevention: 'Use DESCRIBE table_name to verify the table exists before querying.'
    },
    {
      pattern: /ORA-00904/,
      solution: 'Invalid identifier - column name does not exist. Check column name spelling.',
      prevention: 'Use DESCRIBE table_name to see available columns.'
    },
    {
      pattern: /ORA-00936/,
      solution: 'Missing expression - syntax error in SQL statement.',
      prevention: 'Check SQL syntax, especially commas, parentheses, and keywords.'
    },
    {
      pattern: /ORA-00001/,
      solution: 'Unique constraint violated - trying to insert duplicate values.',
      prevention: 'Check existing data before inserting or use MERGE statement.'
    }
  ];

  private bestPractices = [
    {
      category: 'Performance',
      tips: [
        'Use indexes on frequently queried columns',
        'Avoid SELECT * in production queries',
        'Use EXPLAIN PLAN to analyze query performance',
        'Consider partitioning for large tables'
      ]
    },
    {
      category: 'Security',
      tips: [
        'Use bind variables to prevent SQL injection',
        'Grant minimum necessary privileges',
        'Regularly audit user access',
        'Use encrypted connections'
      ]
    },
    {
      category: 'Maintainability',
      tips: [
        'Use meaningful table and column names',
        'Add comments to complex queries',
        'Normalize database design appropriately',
        'Document database schema changes'
      ]
    }
  ];

  static getInstance(): OfflineAIHelper {
    if (!OfflineAIHelper.instance) {
      OfflineAIHelper.instance = new OfflineAIHelper();
    }
    return OfflineAIHelper.instance;
  }

  getAutoComplete(input: string): string[] {
    const inputUpper = input.toUpperCase();
    const suggestions: string[] = [];

    // Keyword completion
    this.oracleKeywords.forEach(keyword => {
      if (keyword.startsWith(inputUpper)) {
        suggestions.push(keyword);
      }
    });

    // Pattern-based suggestions
    this.queryPatterns.forEach(pattern => {
      if (pattern.pattern.test(input)) {
        suggestions.push(...pattern.suggestions);
      }
    });

    return suggestions.slice(0, 10); // Limit to 10 suggestions
  }

  analyzeQuery(query: string): AIResponse[] {
    const responses: AIResponse[] = [];
    const queryUpper = query.toUpperCase();

    // Check for common patterns and provide suggestions
    this.queryPatterns.forEach(pattern => {
      if (pattern.pattern.test(query)) {
        responses.push({
          type: 'suggestion',
          content: pattern.explanation,
          example: pattern.examples[0]
        });
      }
    });

    // Performance optimization suggestions
    if (queryUpper.includes('SELECT *')) {
      responses.push({
        type: 'optimization',
        content: 'Consider specifying column names instead of using SELECT * for better performance.',
        example: 'SELECT id, name, salary FROM employees;',
        severity: 'warning'
      });
    }

    if (queryUpper.includes('WHERE') && !queryUpper.includes('INDEX')) {
      responses.push({
        type: 'optimization',
        content: 'Consider creating an index on frequently queried columns in WHERE clause.',
        example: 'CREATE INDEX idx_emp_dept ON employees(department);'
      });
    }

    // Syntax guidance
    if (queryUpper.includes('JOIN') && !queryUpper.includes('ON')) {
      responses.push({
        type: 'error',
        content: 'JOIN clauses require an ON condition to specify the relationship.',
        example: 'SELECT * FROM employees e JOIN departments d ON e.dept_id = d.id;',
        severity: 'error'
      });
    }

    return responses;
  }

  getErrorHelp(errorMessage: string): AIResponse | null {
    for (const error of this.commonErrors) {
      if (error.pattern.test(errorMessage)) {
        return {
          type: 'error',
          content: error.solution,
          example: error.prevention,
          severity: 'error'
        };
      }
    }

    return {
      type: 'error',
      content: 'Unknown error occurred. Check SQL syntax and table/column names.',
      severity: 'error'
    };
  }

  getBestPractices(category?: string): AIResponse[] {
    const practices = category 
      ? this.bestPractices.filter(p => p.category.toLowerCase() === category.toLowerCase())
      : this.bestPractices;

    return practices.map(practice => ({
      type: 'guidance',
      content: `${practice.category} Best Practices:\n${practice.tips.map(tip => `• ${tip}`).join('\n')}`
    }));
  }

  getQueryExamples(type: string): AIResponse[] {
    const examples: Record<string, string[]> = {
      basic: [
        'SELECT * FROM employees;',
        'SELECT name, salary FROM employees WHERE department = \'IT\';',
        'INSERT INTO employees (id, name, salary) VALUES (1, \'John\', 50000);',
        'UPDATE employees SET salary = salary * 1.1 WHERE department = \'IT\';'
      ],
      advanced: [
        'SELECT e.name, d.name FROM employees e JOIN departments d ON e.dept_id = d.id;',
        'SELECT department, AVG(salary) FROM employees GROUP BY department;',
        'SELECT * FROM employees WHERE salary > (SELECT AVG(salary) FROM employees);'
      ],
      oracle_specific: [
        'SELECT SYSDATE FROM DUAL;',
        'SELECT USER FROM DUAL;',
        'SELECT employee_id, name, ROWNUM FROM employees WHERE ROWNUM <= 10;',
        'CREATE SEQUENCE emp_seq START WITH 1 INCREMENT BY 1;'
      ]
    };

    const queryExamples = examples[type] || examples.basic;
    
    return queryExamples.map(example => ({
      type: 'suggestion',
      content: `Example: ${example}`,
      example
    }));
  }

  getContextualHelp(currentQuery: string, cursorPosition: number): AIResponse[] {
    const responses: AIResponse[] = [];
    const beforeCursor = currentQuery.substring(0, cursorPosition).toUpperCase();
    const afterCursor = currentQuery.substring(cursorPosition).toUpperCase();

    // Context-aware suggestions
    if (beforeCursor.endsWith('SELECT ')) {
      responses.push({
        type: 'suggestion',
        content: 'Type column names or * to select all columns',
        example: 'SELECT id, name, salary'
      });
    }

    if (beforeCursor.includes('FROM ') && !beforeCursor.includes('WHERE')) {
      responses.push({
        type: 'suggestion',
        content: 'Add WHERE clause to filter results',
        example: 'WHERE column_name = value'
      });
    }

    if (beforeCursor.includes('WHERE ') && afterCursor.length === 0) {
      responses.push({
        type: 'suggestion',
        content: 'Common WHERE conditions',
        example: 'column_name = \'value\'\ncolumn_name > 100\ncolumn_name IS NOT NULL'
      });
    }

    return responses;
  }

  getHelpTopics(): { category: string; topics: string[] }[] {
    return [
      {
        category: 'SQL Basics',
        topics: ['SELECT statements', 'INSERT operations', 'UPDATE queries', 'DELETE commands', 'CREATE TABLE']
      },
      {
        category: 'Oracle Specific',
        topics: ['DUAL table', 'SYSDATE functions', 'ROWNUM usage', 'Sequences', 'PL/SQL basics']
      },
      {
        category: 'Performance',
        topics: ['Index optimization', 'Query tuning', 'Execution plans', 'Table partitioning']
      },
      {
        category: 'Troubleshooting',
        topics: ['Common errors', 'Syntax issues', 'Permission problems', 'Data integrity']
      }
    ];
  }
}
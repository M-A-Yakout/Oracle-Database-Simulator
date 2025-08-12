export interface OracleTable {
  name: string;
  columns: OracleColumn[];
  data: Record<string, unknown>[];
  indexes: OracleIndex[];
  constraints: OracleConstraint[];
  created: Date;
}

export interface OracleColumn {
  name: string;
  dataType: string;
  nullable: boolean;
  defaultValue?: unknown;
  length?: number;
  precision?: number;
  scale?: number;
}

export interface OracleIndex {
  name: string;
  columns: string[];
  unique: boolean;
  type: 'BTREE' | 'HASH' | 'BITMAP';
}

export interface OracleConstraint {
  name: string;
  type: 'PRIMARY KEY' | 'FOREIGN KEY' | 'UNIQUE' | 'CHECK' | 'NOT NULL';
  columns: string[];
  referencedTable?: string;
  referencedColumns?: string[];
}

export interface QueryResult {
  success: boolean;
  data?: Record<string, unknown>[];
  columns?: string[];
  rowCount?: number;
  executionTime?: number;
  executionPlan?: ExecutionPlan;
  message?: string;
  error?: string;
}

export interface ExecutionPlan {
  operation: string;
  object: string;
  cost: number;
  cardinality: number;
  bytes: number;
  time: string;
  children?: ExecutionPlan[];
}

export interface SessionState {
  currentSchema: string;
  autoCommit: boolean;
  dateFormat: string;
  numWidth: number;
  pageSize: number;
  transactionActive: boolean;
  savepoints: string[];
  privileges: string[];
}

export interface OracleError {
  code: string;
  message: string;
  line?: number;
  column?: number;
}

export interface ProcedureFunction {
  name: string;
  type: 'PROCEDURE' | 'FUNCTION';
  parameters: Parameter[];
  body: string;
  returnType?: string;
}

export interface Parameter {
  name: string;
  type: string;
  mode: 'IN' | 'OUT' | 'IN OUT';
  defaultValue?: unknown;
}
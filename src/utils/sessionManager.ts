import { SessionState } from '../types/oracle';

export class SessionManager {
  private static instance: SessionManager;
  private sessionState: SessionState;

  private constructor() {
    this.sessionState = this.loadSession();
  }

  static getInstance(): SessionManager {
    if (!SessionManager.instance) {
      SessionManager.instance = new SessionManager();
    }
    return SessionManager.instance;
  }

  private loadSession(): SessionState {
    const saved = localStorage.getItem('oracleSession');
    if (saved) {
      return JSON.parse(saved);
    }
    
    return {
      currentSchema: 'ORACLE_SIM',
      autoCommit: true,
      dateFormat: 'DD-MON-YY',
      numWidth: 10,
      pageSize: 14,
      transactionActive: false,
      savepoints: [],
      privileges: ['CREATE TABLE', 'CREATE INDEX', 'SELECT', 'INSERT', 'UPDATE', 'DELETE']
    };
  }

  saveSession(): void {
    localStorage.setItem('oracleSession', JSON.stringify(this.sessionState));
  }

  getSession(): SessionState {
    return { ...this.sessionState };
  }

  updateSession(updates: Partial<SessionState>): void {
    this.sessionState = { ...this.sessionState, ...updates };
    this.saveSession();
  }

  executeSessionCommand(command: string): string {
    const cmd = command.trim().toUpperCase();
    
    if (cmd === 'COMMIT') {
      this.sessionState.transactionActive = false;
      this.sessionState.savepoints = [];
      this.saveSession();
      return 'Commit complete.';
    }
    
    if (cmd === 'ROLLBACK') {
      this.sessionState.transactionActive = false;
      this.sessionState.savepoints = [];
      this.saveSession();
      return 'Rollback complete.';
    }
    
    if (cmd.startsWith('SAVEPOINT ')) {
      const savepointName = cmd.substring(10);
      this.sessionState.savepoints.push(savepointName);
      this.sessionState.transactionActive = true;
      this.saveSession();
      return `Savepoint ${savepointName} created.`;
    }
    
    if (cmd.startsWith('SET AUTOCOMMIT ')) {
      const value = cmd.substring(15);
      this.sessionState.autoCommit = value === 'ON';
      this.saveSession();
      return `AUTOCOMMIT is ${value}.`;
    }
    
    if (cmd.startsWith('SET PAGESIZE ')) {
      const size = parseInt(cmd.substring(13));
      this.sessionState.pageSize = size;
      this.saveSession();
      return `PAGESIZE ${size}`;
    }
    
    if (cmd === 'SHOW USER') {
      return `USER is "${this.sessionState.currentSchema}"`;
    }
    
    if (cmd === 'SHOW AUTOCOMMIT') {
      return `AUTOCOMMIT ${this.sessionState.autoCommit ? 'ON' : 'OFF'}`;
    }
    
    return `SP2-0042: unknown command "${command}" - rest of line ignored.`;
  }

  startTransaction(): void {
    this.sessionState.transactionActive = true;
    this.saveSession();
  }

  isTransactionActive(): boolean {
    return this.sessionState.transactionActive;
  }
}
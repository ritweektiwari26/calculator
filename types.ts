
export interface HistoryItem {
  id: string;
  expression: string;
  result: string;
  timestamp: Date;
  explanation?: string;
}

export interface CalculationState {
  display: string;
  history: HistoryItem[];
  isThinking: boolean;
  error: string | null;
}

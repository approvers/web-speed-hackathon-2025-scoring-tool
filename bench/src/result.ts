export interface Result {
  audits: Record<string, { score: number | null }>;
  error?: Error;
  scoreX100: number;

  dbRecordKey: string;
  target: { maxScore: number; name: string };
}

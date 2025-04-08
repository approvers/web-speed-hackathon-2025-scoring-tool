export interface Result {
  audits: object;
  error?: Error;
  scoreX100: number;

  dbRecordKey: string;
  target: { maxScore: number; name: string };
}

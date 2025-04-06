export interface Result {
  error?: Error;
  scoreX100: number;
  target: { maxScore: number; name: string };
}

export interface InterpolationFunction {
  (context: any): string;
}
export interface InterpolateService {
  (
    text: string,
    mustHaveExpression?: boolean,
    trustedContext?: string,
    allOrNothing?: boolean,
  ): InterpolationFunction | undefined;
  endSymbol(): string;
  startSymbol(): string;
}

export function $IntervalProvider(): void;
export class $IntervalProvider {
    $get: (string | (($$intervalFactory: any) => any))[];
}
/**
 * Interval ID which uniquely identifies the interval and can be used to cancel it
 */
export type IntervalId = number;

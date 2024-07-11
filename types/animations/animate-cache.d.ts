export function animateCache(): {
    cacheKey(node: any, method: any, addClass: any, removeClass: any): string;
    containsCachedAnimationWithoutDuration(key: any): boolean;
    flush(): void;
    count(key: any): any;
    get(key: any): any;
    put(key: any, value: any, isValid: any): void;
};
export function $$AnimateCacheProvider(): void;
export class $$AnimateCacheProvider {
    $get: (typeof animateCache)[];
}

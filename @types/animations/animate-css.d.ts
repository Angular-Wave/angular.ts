export function AnimateCssProvider(): void;
export class AnimateCssProvider {
    $get: (string | (($$AnimateRunner: any, $$animateCache: any, $$rAFScheduler: any) => (element: any, initialOptions: any) => {
        $$willAnimate: boolean;
        start(): any;
        end: () => void;
    }))[];
}

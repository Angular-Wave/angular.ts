export function $AnimateCssProvider(): void;
export class $AnimateCssProvider {
    $get: (string | (($$AnimateRunner: any, $timeout: any, $$animateCache: any, $$rAFScheduler: any, $$animateQueue: any) => (element: any, initialOptions: any) => {
        $$willAnimate: boolean;
        start(): any;
        end: () => void;
    }))[];
}

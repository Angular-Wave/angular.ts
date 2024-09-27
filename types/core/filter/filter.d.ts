export function FilterProvider($provide: any): void;
export class FilterProvider {
    constructor($provide: any);
    register: (name: any, factory: any) => any;
    $get: (string | (($injector: import("../../core/di/internal-injector").InjectorService) => (name: any) => any))[];
}
export namespace FilterProvider {
    let $inject: string[];
}

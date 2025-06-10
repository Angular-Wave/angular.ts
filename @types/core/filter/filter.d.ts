export function FilterProvider($provide: any): void;
export class FilterProvider {
  constructor($provide: any);
  register: (name: any, factory: any) => any;
  $get: (string | (($injector: any) => (name: any) => any))[];
}
export namespace FilterProvider {
  let $inject: string[];
}

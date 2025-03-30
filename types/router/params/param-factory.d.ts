export class ParamFactory {
    constructor(urlServiceConfig: any);
    urlServiceConfig: any;
    fromConfig(id: any, type: any, state: any): any;
    fromPath(id: any, type: any, state: any): any;
    fromSearch(id: any, type: any, state: any): any;
}

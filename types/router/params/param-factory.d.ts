export class ParamFactory {
    constructor(urlServiceConfig: any);
    urlServiceConfig: any;
    fromConfig(id: any, type: any, state: any): Param;
    fromPath(id: any, type: any, state: any): Param;
    fromSearch(id: any, type: any, state: any): Param;
}
import { Param } from "./param.js";

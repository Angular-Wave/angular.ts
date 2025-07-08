export class ParamFactory {
  /**
   * @param {import("../url/url-config.js").UrlConfigProvider} urlServiceConfig
   */
  constructor(
    urlServiceConfig: import("../url/url-config.js").UrlConfigProvider,
  );
  /**
   * @type {import("../url/url-config.js").UrlConfigProvider}
   */
  urlServiceConfig: import("../url/url-config.js").UrlConfigProvider;
  fromConfig(id: any, type: any, state: any): Param;
  fromPath(id: any, type: any, state: any): Param;
  fromSearch(id: any, type: any, state: any): Param;
}
import { Param } from "./param.js";

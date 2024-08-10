import { DefType, Param } from "./param";

export class ParamFactory {
  constructor(urlServiceConfig) {
    this.urlServiceConfig = urlServiceConfig;
  }

  fromConfig(id, type, state) {
    return new Param(id, type, DefType.CONFIG, this.urlServiceConfig, state);
  }
  fromPath(id, type, state) {
    return new Param(id, type, DefType.PATH, this.urlServiceConfig, state);
  }
  fromSearch(id, type, state) {
    return new Param(id, type, DefType.SEARCH, this.urlServiceConfig, state);
  }
}

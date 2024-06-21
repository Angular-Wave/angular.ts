import { forEach, isDefined, isFunction, isObject } from "../../shared/utils";
import { UrlMatcher } from "./url-matcher";
import { ParamFactory } from "../params/param-factory";

/**
 * Factory for [[UrlMatcher]] instances.
 *
 * The factory is available to ng1 services as
 * `$urlMatcherFactory` or ng1 providers as `$urlMatcherFactoryProvider`.
 */
export class UrlMatcherFactory {
  // TODO: move implementations to UrlConfig (urlService.config)
  constructor(urlServiceConfig) {
    this.urlServiceConfig = urlServiceConfig;
    /** Creates a new [[Param]] for a given location (DefType) */
    this.paramFactory = new ParamFactory(urlServiceConfig);
    /** @deprecated use [[UrlConfig.caseInsensitive]] */
    this.caseInsensitive = (value) => urlServiceConfig.caseInsensitive(value);
    /** @deprecated use [[UrlConfig.defaultSquashPolicy]] */
    this.defaultSquashPolicy = (value) =>
      urlServiceConfig.defaultSquashPolicy(value);
    /** @deprecated use [[UrlConfig.strictMode]] */
    this.strictMode = (value) => urlServiceConfig.strictMode(value);
    /** @deprecated use [[UrlConfig.type]] */
    this.type = (name, definition, definitionFn) => {
      return urlServiceConfig.type(name, definition, definitionFn) || this;
    };
  }
  /**
   * Creates a [[UrlMatcher]] for the specified pattern.
   *
   * @param pattern  The URL pattern.
   * @param config  The config object hash.
   * @returns The UrlMatcher.
   */
  compile(pattern, config) {
    const urlConfig = this.urlServiceConfig;
    // backward-compatible support for config.params -> config.state.params
    const params = config && !config.state && config.params;
    config = params ? Object.assign({ state: { params } }, config) : config;
    const globalConfig = {
      strict: urlConfig._isStrictMode,
      caseInsensitive: urlConfig._isCaseInsensitive,
      decodeParams: urlConfig._decodeParams,
    };
    return new UrlMatcher(
      pattern,
      urlConfig.paramTypes,
      this.paramFactory,
      Object.assign(globalConfig, config),
    );
  }
  /**
   * Returns true if the specified object is a [[UrlMatcher]], or false otherwise.
   *
   * @param object  The object to perform the type check against.
   * @returns `true` if the object matches the `UrlMatcher` interface, by
   *          implementing all the same methods.
   */
  isMatcher(object) {
    // TODO: typeof?
    if (!isObject(object)) return false;
    let result = true;
    forEach(UrlMatcher.prototype, (val, name) => {
      if (isFunction(val))
        result = result && isDefined(object[name]) && isFunction(object[name]);
    });
    return result;
  }

  $get() {
    const urlConfig = this.urlServiceConfig;
    urlConfig.paramTypes.enqueue = false;
    urlConfig.paramTypes._flushTypeQueue();
    return this;
  }
}

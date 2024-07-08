/**
 * @typedef BindingTuple
 * @property {string} name
 * @property {string} type
 */
/**
 * Service which manages loading of templates from a ViewConfig.
 */
export class TemplateFactory {
  /** @type {boolean} */
  _useHttp: boolean;
  $get: (
    | string
    | ((
        $http: angular.IHttpService,
        $templateCache: angular.ITemplateCacheService,
        $templateRequest: angular.ITemplateRequestService,
        $q: angular.IQService,
        $injector: angular.auto.IInjectorService,
      ) => this)
  )[];
  $templateRequest: angular.ITemplateRequestService;
  $http: angular.IHttpService;
  $templateCache: angular.ITemplateCacheService;
  $q: angular.IQService;
  $injector: angular.auto.IInjectorService;
  /**
   * Forces the provider to use $http service directly
   * @param {boolean} value
   */
  useHttpService(value: boolean): void;
  /**
   * Creates a template from a configuration object.
   *
   * @param config Configuration object for which to load a template.
   * The following properties are search in the specified order, and the first one
   * that is defined is used to create the template:
   *
   * @param {angular.Ng1ViewDeclaration} config
   * @param {any} params  Parameters to pass to the template function.
   * @param {angular.ResolveContext} context The resolve context associated with the template's view
   *
   * @return {string|object}  The template html as a string, or a promise for
   * that string,or `null` if no template is configured.
   */
  fromConfig(
    config: angular.Ng1ViewDeclaration,
    params: any,
    context: angular.ResolveContext,
  ): string | object;
  /**
   * Creates a template from a string or a function returning a string.
   *
   * @param {string | Function} template html template as a string or function that returns an html template as a string.
   * @param {angular.RawParams} [params] Parameters to pass to the template function.
   *
   * @return {string|object} The template html as a string, or a promise for that
   * string.
   */
  fromString(
    template: string | Function,
    params?: angular.RawParams,
  ): string | object;
  /**
   * Loads a template from the a URL via `$http` and `$templateCache`.
   *
   * @param {string|Function} url url of the template to load, or a function
   * that returns a url.
   * @param {Object} params Parameters to pass to the url function.
   * @return {string|Promise.<string>} The template html as a string, or a promise
   * for that string.
   */
  fromUrl(url: string | Function, params: any): string | Promise<string>;
  /**
   * Creates a template by invoking an injectable provider function.
   *
   * @param {angular.IInjectable} provider Function to invoke via `locals`
   * @param {Function} injectFn a function used to invoke the template provider
   * @param {angular.ResolveContext} context
   * @return {string|Promise.<string>} The template html as a string, or a promise
   * for that string.
   */
  fromProvider(
    provider: angular.IInjectable,
    params: any,
    context: angular.ResolveContext,
  ): string | Promise<string>;
  /**
   * Creates a component's template by invoking an injectable provider function.
   *
   * @param {angular.IInjectable} provider Function to invoke via `locals`
   * @param {Function} injectFn a function used to invoke the template provider
   * @return {string} The template html as a string: "<component-name input1='::$resolve.foo'></component-name>".
   */
  fromComponentProvider(
    provider: angular.IInjectable,
    params: any,
    context: any,
  ): string;
  /**
   * Creates a template from a component's name
   *
   * This implements route-to-component.
   * It works by retrieving the component (directive) metadata from the injector.
   * It analyses the component's bindings, then constructs a template that instantiates the component.
   * The template wires input and output bindings to resolves or from the parent component.
   *
   * @param {angular.IAugmentedJQuery} ngView {object} The parent ui-view (for binding outputs to callbacks)
   * @param {angular.ResolveContext} context The ResolveContext (for binding outputs to callbacks returned from resolves)
   * @param {string} component {string} Component's name in camel case.
   * @param {any} [bindings] An object defining the component's bindings: {foo: '<'}
   * @return {string} The template as a string: "<component-name input1='::$resolve.foo'></component-name>".
   */
  makeComponentTemplate(
    ngView: angular.IAugmentedJQuery,
    context: angular.ResolveContext,
    component: string,
    bindings?: any,
  ): string;
}
export type BindingTuple = {
  name: string;
  type: string;
};

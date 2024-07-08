export function escapeForRegexp(s: any): any;
export function adjustMatcher(matcher: any): any;
/**
 * @ngdoc service
 * @name $sceDelegate
 * @kind function
 *
 * @description
 *
 * `$sceDelegate` is a service that is used by the `$sce` service to provide {@link ng.$sce Strict
 * Contextual Escaping (SCE)} services to AngularJS.
 *
 * For an overview of this service and the functionnality it provides in AngularJS, see the main
 * page for {@link ng.$sce SCE}. The current page is targeted for developers who need to alter how
 * SCE works in their application, which shouldn't be needed in most cases.
 *
 * <div class="alert alert-danger">
 * AngularJS strongly relies on contextual escaping for the security of bindings: disabling or
 * modifying this might cause cross site scripting (XSS) vulnerabilities. For libraries owners,
 * changes to this service will also influence users, so be extra careful and document your changes.
 * </div>
 *
 * Typically, you would configure or override the {@link ng.$sceDelegate $sceDelegate} instead of
 * the `$sce` service to customize the way Strict Contextual Escaping works in AngularJS.  This is
 * because, while the `$sce` provides numerous shorthand methods, etc., you really only need to
 * override 3 core functions (`trustAs`, `getTrusted` and `valueOf`) to replace the way things
 * work because `$sce` delegates to `$sceDelegate` for these operations.
 *
 * Refer {@link ng.$sceDelegateProvider $sceDelegateProvider} to configure this service.
 *
 * The default instance of `$sceDelegate` should work out of the box with little pain.  While you
 * can override it completely to change the behavior of `$sce`, the common case would
 * involve configuring the {@link ng.$sceDelegateProvider $sceDelegateProvider} instead by setting
 * your own trusted and banned resource lists for trusting URLs used for loading AngularJS resources
 * such as templates.  Refer {@link ng.$sceDelegateProvider#trustedResourceUrlList
 * $sceDelegateProvider.trustedResourceUrlList} and {@link
 * ng.$sceDelegateProvider#bannedResourceUrlList $sceDelegateProvider.bannedResourceUrlList}
 */
/**
 * @ngdoc provider
 * @name $sceDelegateProvider
 *
 *
 * @description
 *
 * The `$sceDelegateProvider` provider allows developers to configure the {@link ng.$sceDelegate
 * $sceDelegate service}, used as a delegate for {@link ng.$sce Strict Contextual Escaping (SCE)}.
 *
 * The `$sceDelegateProvider` allows one to get/set the `trustedResourceUrlList` and
 * `bannedResourceUrlList` used to ensure that the URLs used for sourcing AngularJS templates and
 * other script-running URLs are safe (all places that use the `$sce.RESOURCE_URL` context). See
 * {@link ng.$sceDelegateProvider#trustedResourceUrlList
 * $sceDelegateProvider.trustedResourceUrlList} and
 * {@link ng.$sceDelegateProvider#bannedResourceUrlList $sceDelegateProvider.bannedResourceUrlList},
 *
 * For the general details about this service in AngularJS, read the main page for {@link ng.$sce
 * Strict Contextual Escaping (SCE)}.
 *
 * **Example**:  Consider the following case. <a name="example"></a>
 *
 * - your app is hosted at url `http://myapp.example.com/`
 * - but some of your templates are hosted on other domains you control such as
 *   `http://srv01.assets.example.com/`, `http://srv02.assets.example.com/`, etc.
 * - and you have an open redirect at `http://myapp.example.com/clickThru?...`.
 *
 * Here is what a secure configuration for this scenario might look like:
 *
 * ```
 *  angular.module('myApp', []).config(function($sceDelegateProvider) {
 *    $sceDelegateProvider.trustedResourceUrlList([
 *      // Allow same origin resource loads.
 *      'self',
 *      // Allow loading from our assets domain.  Notice the difference between * and **.
 *      'http://srv*.assets.example.com/**'
 *    ]);
 *
 *    // The banned resource URL list overrides the trusted resource URL list so the open redirect
 *    // here is blocked.
 *    $sceDelegateProvider.bannedResourceUrlList([
 *      'http://myapp.example.com/clickThru**'
 *    ]);
 *  });
 * ```
 * Note that an empty trusted resource URL list will block every resource URL from being loaded, and will require
 * you to manually mark each one as trusted with `$sce.trustAsResourceUrl`. However, templates
 * requested by {@link ng.$templateRequest $templateRequest} that are present in
 * {@link ng.$templateCache $templateCache} will not go through this check. If you have a mechanism
 * to populate your templates in that cache at config time, then it is a good idea to remove 'self'
 * from the trusted resource URL lsit. This helps to mitigate the security impact of certain types
 * of issues, like for instance attacker-controlled `ng-includes`.
 */
export function $SceDelegateProvider(): void;
export class $SceDelegateProvider {
  SCE_CONTEXTS: {
    HTML: string;
    CSS: string;
    MEDIA_URL: string;
    URL: string;
    RESOURCE_URL: string;
    JS: string;
  };
  /**
   * @ngdoc method
   * @name $sceDelegateProvider#trustedResourceUrlList
   * @kind function
   *
   * @param {Array=} trustedResourceUrlList When provided, replaces the trustedResourceUrlList with
   *     the value provided.  This must be an array or null.  A snapshot of this array is used so
   *     further changes to the array are ignored.
   *     Follow {@link ng.$sce#resourceUrlPatternItem this link} for a description of the items
   *     allowed in this array.
   *
   * @return {Array} The currently set trusted resource URL array.
   *
   * @description
   * Sets/Gets the list trusted of resource URLs.
   *
   * The **default value** when no `trustedResourceUrlList` has been explicitly set is `['self']`
   * allowing only same origin resource requests.
   *
   * <div class="alert alert-warning">
   * **Note:** the default `trustedResourceUrlList` of 'self' is not recommended if your app shares
   * its origin with other apps! It is a good idea to limit it to only your application's directory.
   * </div>
   */
  trustedResourceUrlList: (value: any, ...args: any[]) => any[];
  /**
   * @ngdoc method
   * @name $sceDelegateProvider#bannedResourceUrlList
   * @kind function
   *
   * @param {Array=} bannedResourceUrlList When provided, replaces the `bannedResourceUrlList` with
   *     the value provided. This must be an array or null. A snapshot of this array is used so
   *     further changes to the array are ignored.</p><p>
   *     Follow {@link ng.$sce#resourceUrlPatternItem this link} for a description of the items
   *     allowed in this array.</p><p>
   *     The typical usage for the `bannedResourceUrlList` is to **block
   *     [open redirects](http://cwe.mitre.org/data/definitions/601.html)** served by your domain as
   *     these would otherwise be trusted but actually return content from the redirected domain.
   *     </p><p>
   *     Finally, **the banned resource URL list overrides the trusted resource URL list** and has
   *     the final say.
   *
   * @return {Array} The currently set `bannedResourceUrlList` array.
   *
   * @description
   * Sets/Gets the `bannedResourceUrlList` of trusted resource URLs.
   *
   * The **default value** when no trusted resource URL list has been explicitly set is the empty
   * array (i.e. there is no `bannedResourceUrlList`.)
   */
  bannedResourceUrlList: (value: any, ...args: any[]) => any[];
  $get: (
    | string
    | ((
        $injector: any,
        $$sanitizeUri: any,
      ) => {
        trustAs: (type: string, trustedValue: any) => any;
        getTrusted: (type: string, maybeTrusted: any) => any;
        valueOf: (maybeTrusted: any) => any;
      })
  )[];
}
/**
 * @ngdoc provider
 * @name $sceProvider
 *
 *
 * @description
 *
 * The $sceProvider provider allows developers to configure the {@link ng.$sce $sce} service.
 * -   enable/disable Strict Contextual Escaping (SCE) in a module
 * -   override the default implementation with a custom delegate
 *
 * Read more about {@link ng.$sce Strict Contextual Escaping (SCE)}.
 */
/**
 * @ngdoc service
 * @name $sce
 * @kind function
 *
 * @description
 *
 * `$sce` is a service that provides Strict Contextual Escaping services to AngularJS.
 *
 * ## Strict Contextual Escaping
 *
 * Strict Contextual Escaping (SCE) is a mode in which AngularJS constrains bindings to only render
 * trusted values. Its goal is to assist in writing code in a way that (a) is secure by default, and
 * (b) makes auditing for security vulnerabilities such as XSS, clickjacking, etc. a lot easier.
 *
 * ### Overview
 *
 * To systematically block XSS security bugs, AngularJS treats all values as untrusted by default in
 * HTML or sensitive URL bindings. When binding untrusted values, AngularJS will automatically
 * run security checks on them (sanitizations, trusted URL resource, depending on context), or throw
 * when it cannot guarantee the security of the result. That behavior depends strongly on contexts:
 * HTML can be sanitized, but template URLs cannot, for instance.
 *
 * To illustrate this, consider the `ng-bind-html` directive. It renders its value directly as HTML:
 * we call that the *context*. When given an untrusted input, AngularJS will attempt to sanitize it
 * before rendering if a sanitizer is available, and throw otherwise. To bypass sanitization and
 * render the input as-is, you will need to mark it as trusted for that context before attempting
 * to bind it.
 *
 * As of version 1.2, AngularJS ships with SCE enabled by default.
 *
 * ### In practice
 *
 * Here's an example of a binding in a privileged context:
 *
 * ```
 * <input ng-model="userHtml" aria-label="User input">
 * <div ng-bind-html="userHtml"></div>
 * ```
 *
 * Notice that `ng-bind-html` is bound to `userHtml` controlled by the user.  With SCE
 * disabled, this application allows the user to render arbitrary HTML into the DIV, which would
 * be an XSS security bug. In a more realistic example, one may be rendering user comments, blog
 * articles, etc. via bindings. (HTML is just one example of a context where rendering user
 * controlled input creates security vulnerabilities.)
 *
 * For the case of HTML, you might use a library, either on the client side, or on the server side,
 * to sanitize unsafe HTML before binding to the value and rendering it in the document.
 *
 * How would you ensure that every place that used these types of bindings was bound to a value that
 * was sanitized by your library (or returned as safe for rendering by your server?)  How can you
 * ensure that you didn't accidentally delete the line that sanitized the value, or renamed some
 * properties/fields and forgot to update the binding to the sanitized value?
 *
 * To be secure by default, AngularJS makes sure bindings go through that sanitization, or
 * any similar validation process, unless there's a good reason to trust the given value in this
 * context.  That trust is formalized with a function call. This means that as a developer, you
 * can assume all untrusted bindings are safe. Then, to audit your code for binding security issues,
 * you just need to ensure the values you mark as trusted indeed are safe - because they were
 * received from your server, sanitized by your library, etc. You can organize your codebase to
 * help with this - perhaps allowing only the files in a specific directory to do this.
 * Ensuring that the internal API exposed by that code doesn't markup arbitrary values as safe then
 * becomes a more manageable task.
 *
 * In the case of AngularJS' SCE service, one uses {@link ng.$sce#trustAs $sce.trustAs}
 * (and shorthand methods such as {@link ng.$sce#trustAsHtml $sce.trustAsHtml}, etc.) to
 * build the trusted versions of your values.
 *
 * ### How does it work?
 *
 * In privileged contexts, directives and code will bind to the result of {@link ng.$sce#getTrusted
 * $sce.getTrusted(context, value)} rather than to the value directly.  Think of this function as
 * a way to enforce the required security context in your data sink. Directives use {@link
 * ng.$sce#parseAs $sce.parseAs} rather than `$parse` to watch attribute bindings, which performs
 * the {@link ng.$sce#getTrusted $sce.getTrusted} behind the scenes on non-constant literals. Also,
 * when binding without directives, AngularJS will understand the context of your bindings
 * automatically.
 *
 * As an example, {@link ng.directive:ngBindHtml ngBindHtml} uses {@link
 * ng.$sce#parseAsHtml $sce.parseAsHtml(binding expression)}.  Here's the actual code (slightly
 * simplified):
 *
 * ```
 * let ngBindHtmlDirective = ['$sce', function($sce) {
 *   return function(scope, element, attr) {
 *     scope.$watch($sce.parseAsHtml(attr.ngBindHtml), function(value) {
 *       element.html(value || '');
 *     });
 *   };
 * }];
 * ```
 *
 * ### Impact on loading templates
 *
 * This applies both to the {@link ng.directive:ngInclude `ng-include`} directive as well as
 * `templateUrl`'s specified by {@link guide/directive directives}.
 *
 * By default, AngularJS only loads templates from the same domain and protocol as the application
 * document.  This is done by calling {@link ng.$sce#getTrustedResourceUrl
 * $sce.getTrustedResourceUrl} on the template URL.  To load templates from other domains and/or
 * protocols, you may either add them to the {@link ng.$sceDelegateProvider#trustedResourceUrlList
 * trustedResourceUrlList} or {@link ng.$sce#trustAsResourceUrl wrap them} into trusted values.
 *
 * *Please note*:
 * The browser's
 * [Same Origin Policy](https://code.google.com/p/browsersec/wiki/Part2#Same-origin_policy_for_XMLHttpRequest)
 * and [Cross-Origin Resource Sharing (CORS)](http://www.w3.org/TR/cors/)
 * policy apply in addition to this and may further restrict whether the template is successfully
 * loaded.  This means that without the right CORS policy, loading templates from a different domain
 * won't work on all browsers.  Also, loading templates from `file://` URL does not work on some
 * browsers.
 *
 * ### This feels like too much overhead
 *
 * It's important to remember that SCE only applies to interpolation expressions.
 *
 * If your expressions are constant literals, they're automatically trusted and you don't need to
 * call `$sce.trustAs` on them (e.g.
 * `<div ng-bind-html="'<b>implicitly trusted</b>'"></div>`) just works (remember to include the
 * `ngSanitize` module). The `$sceDelegate` will also use the `$sanitize` service if it is available
 * when binding untrusted values to `$sce.HTML` context.
 * AngularJS provides an implementation in `angular-sanitize.js`, and if you
 * wish to use it, you will also need to depend on the {@link ngSanitize `ngSanitize`} module in
 * your application.
 *
 * The included {@link ng.$sceDelegate $sceDelegate} comes with sane defaults to allow you to load
 * templates in `ng-include` from your application's domain without having to even know about SCE.
 * It blocks loading templates from other domains or loading templates over http from an https
 * served document.  You can change these by setting your own custom {@link
 * ng.$sceDelegateProvider#trustedResourceUrlList trusted resource URL list} and {@link
 * ng.$sceDelegateProvider#bannedResourceUrlList banned resource URL list} for matching such URLs.
 *
 * This significantly reduces the overhead.  It is far easier to pay the small overhead and have an
 * application that's secure and can be audited to verify that with much more ease than bolting
 * security onto an application later.
 *
 * <a name="contexts"></a>
 * ### What trusted context types are supported?
 *
 * | Context             | Notes          |
 * |---------------------|----------------|
 * | `$sce.HTML`         | For HTML that's safe to source into the application.  The {@link ng.directive:ngBindHtml ngBindHtml} directive uses this context for bindings. If an unsafe value is encountered and the {@link ngSanitize $sanitize} module is present this will sanitize the value instead of throwing an error. |
 * | `$sce.CSS`          | For CSS that's safe to source into the application.  Currently unused.  Feel free to use it in your own directives. |
 * | `$sce.MEDIA_URL`    | For URLs that are safe to render as media. Is automatically converted from string by sanitizing when needed. |
 * | `$sce.URL`          | For URLs that are safe to follow as links. Is automatically converted from string by sanitizing when needed. Note that `$sce.URL` makes a stronger statement about the URL than `$sce.MEDIA_URL` does and therefore contexts requiring values trusted for `$sce.URL` can be used anywhere that values trusted for `$sce.MEDIA_URL` are required.|
 * | `$sce.RESOURCE_URL` | For URLs that are not only safe to follow as links, but whose contents are also safe to include in your application.  Examples include `ng-include`, `src` / `ngSrc` bindings for tags other than `IMG` (e.g. `IFRAME`, `OBJECT`, etc.)  <br><br>Note that `$sce.RESOURCE_URL` makes a stronger statement about the URL than `$sce.URL` or `$sce.MEDIA_URL` do and therefore contexts requiring values trusted for `$sce.RESOURCE_URL` can be used anywhere that values trusted for `$sce.URL` or `$sce.MEDIA_URL` are required. <br><br> The {@link $sceDelegateProvider#trustedResourceUrlList $sceDelegateProvider#trustedResourceUrlList()} and {@link $sceDelegateProvider#bannedResourceUrlList $sceDelegateProvider#bannedResourceUrlList()} can be used to restrict trusted origins for `RESOURCE_URL` |
 * | `$sce.JS`           | For JavaScript that is safe to execute in your application's context.  Currently unused.  Feel free to use it in your own directives. |
 *
 *
 * <div class="alert alert-warning">
 * Be aware that, before AngularJS 1.7.0, `a[href]` and `img[src]` used to sanitize their
 * interpolated values directly rather than rely upon {@link ng.$sce#getTrusted `$sce.getTrusted`}.
 *
 * **As of 1.7.0, this is no longer the case.**
 *
 * Now such interpolations are marked as requiring `$sce.URL` (for `a[href]`) or `$sce.MEDIA_URL`
 * (for `img[src]`), so that the sanitization happens (via `$sce.getTrusted...`) when the `$interpolate`
 * service evaluates the expressions.
 * </div>
 *
 * There are no CSS or JS context bindings in AngularJS currently, so their corresponding `$sce.trustAs`
 * functions aren't useful yet. This might evolve.
 *
 * ### Format of items in {@link ng.$sceDelegateProvider#trustedResourceUrlList trustedResourceUrlList}/{@link ng.$sceDelegateProvider#bannedResourceUrlList bannedResourceUrlList} <a name="resourceUrlPatternItem"></a>
 *
 *  Each element in these arrays must be one of the following:
 *
 *  - **'self'**
 *    - The special **string**, `'self'`, can be used to match against all URLs of the **same
 *      domain** as the application document using the **same protocol**.
 *  - **String** (except the special value `'self'`)
 *    - The string is matched against the full *normalized / absolute URL* of the resource
 *      being tested (substring matches are not good enough.)
 *    - There are exactly **two wildcard sequences** - `*` and `**`.  All other characters
 *      match themselves.
 *    - `*`: matches zero or more occurrences of any character other than one of the following 6
 *      characters: '`:`', '`/`', '`.`', '`?`', '`&`' and '`;`'.  It's a useful wildcard for use
 *      for matching resource URL lists.
 *    - `**`: matches zero or more occurrences of *any* character.  As such, it's not
 *      appropriate for use in a scheme, domain, etc. as it would match too much.  (e.g.
 *      http://**.example.com/ would match http://evil.com/?ignore=.example.com/ and that might
 *      not have been the intention.)  Its usage at the very end of the path is ok.  (e.g.
 *      http://foo.example.com/templates/**).
 *  - **RegExp** (*see caveat below*)
 *    - *Caveat*:  While regular expressions are powerful and offer great flexibility,  their syntax
 *      (and all the inevitable escaping) makes them *harder to maintain*.  It's easy to
 *      accidentally introduce a bug when one updates a complex expression (imho, all regexes should
 *      have good test coverage).  For instance, the use of `.` in the regex is correct only in a
 *      small number of cases.  A `.` character in the regex used when matching the scheme or a
 *      subdomain could be matched against a `:` or literal `.` that was likely not intended.   It
 *      is highly recommended to use the string patterns and only fall back to regular expressions
 *      as a last resort.
 *    - The regular expression must be an instance of RegExp (i.e. not a string.)  It is
 *      matched against the **entire** *normalized / absolute URL* of the resource being tested
 *      (even when the RegExp did not have the `^` and `$` codes.)  In addition, any flags
 *      present on the RegExp (such as multiline, global, ignoreCase) are ignored.
 *    - If you are generating your JavaScript from some other templating engine (not
 *      recommended, e.g. in issue [#4006](https://github.com/angular/angular.js/issues/4006)),
 *      remember to escape your regular expression (and be aware that you might need more than
 *      one level of escaping depending on your templating engine and the way you interpolated
 *      the value.)  Do make use of your platform's escaping mechanism as it might be good
 *      enough before coding your own.  E.g. Ruby has
 *      [Regexp.escape(str)](http://www.ruby-doc.org/core-2.0.0/Regexp.html#method-c-escape)
 *      and Python has [re.escape](http://docs.python.org/library/re.html#re.escape).
 *      Javascript lacks a similar built in function for escaping.  Take a look at Google
 *      Closure library's [goog.string.regExpEscape(s)](
 *      http://docs.closure-library.googlecode.com/git/closure_goog_string_string.js.source.html#line962).
 *
 * Refer {@link ng.$sceDelegateProvider $sceDelegateProvider} for an example.
 *
 *
 * ## Can I disable SCE completely?
 *
 * Yes, you can.  However, this is strongly discouraged.  SCE gives you a lot of security benefits
 * for little coding overhead.  It will be much harder to take an SCE disabled application and
 * either secure it on your own or enable SCE at a later stage.  It might make sense to disable SCE
 * for cases where you have a lot of existing code that was written before SCE was introduced and
 * you're migrating them a module at a time. Also do note that this is an app-wide setting, so if
 * you are writing a library, you will cause security bugs applications using it.
 *
 * That said, here's how you can completely disable SCE:
 *
 * ```
 * angular.module('myAppWithSceDisabledmyApp', []).config(function($sceProvider) {
 *   // Completely disable SCE.  For demonstration purposes only!
 *   // Do not use in new projects or libraries.
 *   $sceProvider.enabled(false);
 * });
 * ```
 *
 */
export function $SceProvider(): void;
export class $SceProvider {
  /**
   * @ngdoc method
   * @name $sceProvider#enabled
   * @kind function
   *
   * @param {boolean=} value If provided, then enables/disables SCE application-wide.
   * @return {boolean} True if SCE is enabled, false otherwise.
   *
   * @description
   * Enables/disables SCE and returns the current value.
   */
  enabled: (value?: boolean | undefined, ...args: any[]) => boolean;
  $get: (string | (($parse: any, $sceDelegate: any) => any))[];
}
export namespace SCE_CONTEXTS {
  let HTML: string;
  let CSS: string;
  let MEDIA_URL: string;
  let URL: string;
  let RESOURCE_URL: string;
  let JS: string;
}

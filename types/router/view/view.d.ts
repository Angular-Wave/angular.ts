/**
 * The View service
 *
 * This service pairs existing `ui-view` components (which live in the DOM)
 * with view configs (from the state declaration objects: [[StateDeclaration.views]]).
 *
 * - After a successful Transition, the views from the newly entered states are activated via [[activateViewConfig]].
 *   The views from exited states are deactivated via [[deactivateViewConfig]].
 *   (See: the [[registerActivateViews]] Transition Hook)
 *
 * - As `ui-view` components pop in and out of existence, they register themselves using [[registerUIView]].
 *
 * - When the [[sync]] function is called, the registered `ui-view`(s) ([[ActiveUIView]])
 * are configured with the matching [[ViewConfig]](s)
 *
 */
export class ViewService {
    _ngViews: any[];
    _viewConfigs: any[];
    _viewConfigFactories: {};
    _listeners: any[];
    _pluginapi: {
        _rootViewContext: any;
        _viewConfigFactory: any;
        _registeredUIView: (id: any) => undefined;
        _registeredUIViews: () => any[];
        _activeViewConfigs: () => any[];
        _onSync: (listener: any) => () => any;
    };
    $get: (() => this)[];
    _rootViewContext(context: any): any;
    _rootContext: any;
    _viewConfigFactory(viewType: any, factory: any): void;
    createViewConfig(path: any, decl: any): any[];
    /**
     * Deactivates a ViewConfig.
     *
     * This function deactivates a `ViewConfig`.
     * After calling [[sync]], it will un-pair from any `ui-view` with which it is currently paired.
     *
     * @param viewConfig The ViewConfig view to deregister.
     */
    deactivateViewConfig(viewConfig: any): void;
    activateViewConfig(viewConfig: any): void;
    sync(): void;
    /**
     * Registers a `ui-view` component
     *
     * When a `ui-view` component is created, it uses this method to register itself.
     * After registration the [[sync]] method is used to ensure all `ui-view` are configured with the proper [[ViewConfig]].
     *
     * Note: the `ui-view` component uses the `ViewConfig` to determine what view should be loaded inside the `ui-view`,
     * and what the view's state context is.
     *
     * Note: There is no corresponding `deregisterUIView`.
     *       A `ui-view` should hang on to the return value of `registerUIView` and invoke it to deregister itself.
     *
     * @param ngView The metadata for a UIView
     * @return a de-registration function used when the view is destroyed.
     */
    registerUIView(ngView: any): () => void;
    /**
     * Returns the list of views currently available on the page, by fully-qualified name.
     *
     * @return {Array} Returns an array of fully-qualified view names.
     */
    available(): any[];
    /**
     * Returns the list of views on the page containing loaded content.
     *
     * @return {Array} Returns an array of fully-qualified view names.
     */
    active(): any[];
}
export namespace ViewService {
    /**
     * Given a ui-view and a ViewConfig, determines if they "match".
     *
     * A ui-view has a fully qualified name (fqn) and a context object.  The fqn is built from its overall location in
     * the DOM, describing its nesting relationship to any parent ui-view tags it is nested inside of.
     *
     * A ViewConfig has a target ui-view name and a context anchor.  The ui-view name can be a simple name, or
     * can be a segmented ui-view path, describing a portion of a ui-view fqn.
     *
     * In order for a ui-view to match ViewConfig, ui-view's $type must match the ViewConfig's $type
     *
     * If the ViewConfig's target ui-view name is a simple name (no dots), then a ui-view matches if:
     * - the ui-view's name matches the ViewConfig's target name
     * - the ui-view's context matches the ViewConfig's anchor
     *
     * If the ViewConfig's target ui-view name is a segmented name (with dots), then a ui-view matches if:
     * - There exists a parent ui-view where:
     *    - the parent ui-view's name matches the first segment (index 0) of the ViewConfig's target name
     *    - the parent ui-view's context matches the ViewConfig's anchor
     * - And the remaining segments (index 1..n) of the ViewConfig's target name match the tail of the ui-view's fqn
     *
     * Example:
     *
     * DOM:
     * <ui-view>                        <!-- created in the root context (name: "") -->
     *   <ui-view name="foo">                <!-- created in the context named: "A"      -->
     *     <ui-view>                    <!-- created in the context named: "A.B"    -->
     *       <ui-view name="bar">            <!-- created in the context named: "A.B.C"  -->
     *       </ui-view>
     *     </ui-view>
     *   </ui-view>
     * </ui-view>
     *
     * ngViews: [
     *  { fqn: "$default",                  creationContext: { name: "" } },
     *  { fqn: "$default.foo",              creationContext: { name: "A" } },
     *  { fqn: "$default.foo.$default",     creationContext: { name: "A.B" } }
     *  { fqn: "$default.foo.$default.bar", creationContext: { name: "A.B.C" } }
     * ]
     *
     * These four view configs all match the ui-view with the fqn: "$default.foo.$default.bar":
     *
     * - ViewConfig1: { ngViewName: "bar",                       ngViewContextAnchor: "A.B.C" }
     * - ViewConfig2: { ngViewName: "$default.bar",              ngViewContextAnchor: "A.B" }
     * - ViewConfig3: { ngViewName: "foo.$default.bar",          ngViewContextAnchor: "A" }
     * - ViewConfig4: { ngViewName: "$default.foo.$default.bar", ngViewContextAnchor: "" }
     *
     * Using ViewConfig3 as an example, it matches the ui-view with fqn "$default.foo.$default.bar" because:
     * - The ViewConfig's segmented target name is: [ "foo", "$default", "bar" ]
     * - There exists a parent ui-view (which has fqn: "$default.foo") where:
     *    - the parent ui-view's name "foo" matches the first segment "foo" of the ViewConfig's target name
     *    - the parent ui-view's context "A" matches the ViewConfig's anchor context "A"
     * - And the remaining segments [ "$default", "bar" ].join("."_ of the ViewConfig's target name match
     *   the tail of the ui-view's fqn "default.bar"
     *
     * @internal
     */
    function matches(ngViewsByFqn: any, ngView: any): (viewConfig: any) => boolean;
}

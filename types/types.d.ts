export namespace angular {
    type InjectorService = {
        /**
         * Annotate a function or an array of inline annotations.
         */
        annotate: (arg0: Function, arg1: boolean | undefined) => string[];
        /**
         * Get a service by name.
         */
        get: (arg0: string, arg1: string | undefined) => T;
        /**
         * , any=): T} instantiate Instantiate a type constructor with optional locals.
         */
        "": new () => (...args: any[]) => any;
        /**
         * Invoke a function with optional context and locals.
         */
        invoke: (arg0: Injectable<Function | ((...args: any[]) => T)>, arg1: any | undefined, arg2: any | undefined) => T;
        /**
         * Add and load new modules to the injector.
         */
        loadNewModules: (arg0: Array<IModule | string | Injectable<(...args: any[]) => void>>) => void;
        /**
         * A map of all the modules loaded into the injector.
         */
        modules: {
            [x: string]: IModule;
        };
        /**
         * Indicates if strict dependency injection is enforced.
         */
        strictDi: boolean;
    };
}

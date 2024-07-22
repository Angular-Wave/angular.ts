export function selectDirective(): {
    restrict: string;
    require: string[];
    controller: typeof SelectController;
    priority: number;
    link: {
        pre: (scope: any, element: any, attr: any, ctrls: any) => void;
        post: (scope: any, element: any, attrs: any, ctrls: any) => void;
    };
};
export const optionDirective: (string | (($interpolate: any) => {
    restrict: string;
    priority: number;
    compile(element: any, attr: any): (scope: any, element: any, attr: any) => void;
}))[];
declare function SelectController($element: any, $scope: any): void;
declare class SelectController {
    constructor($element: any, $scope: any);
    selectValueMap: {};
    ngModelCtrl: {
        $setViewValue: () => void;
        $render: () => void;
    };
    multiple: boolean;
    unknownOption: JQLite;
    hasEmptyOption: boolean;
    emptyOption: any;
    renderUnknownOption: (val: any) => void;
    updateUnknownOption: (val: any) => void;
    generateUnknownOptionValue: (val: any) => string;
    removeUnknownOption: () => void;
    selectEmptyOption: () => void;
    unselectEmptyOption: () => void;
    readValue: () => any;
    writeValue: (value: any) => void;
    addOption: (value: any, element: any) => void;
    removeOption: (value: any) => void;
    hasOption: (value: any) => boolean;
    /**
     * @ngdoc method
     * @name select.SelectController#$hasEmptyOption
     *
     * @description
     *
     * Returns `true` if the select element currently has an empty option
     * element, i.e. an option that signifies that the select is empty / the selection is null.
     *
     */
    $hasEmptyOption: () => boolean;
    /**
     * @ngdoc method
     * @name select.SelectController#$isUnknownOptionSelected
     *
     * @description
     *
     * Returns `true` if the select element's unknown option is selected. The unknown option is added
     * and automatically selected whenever the select model doesn't match any option.
     *
     */
    $isUnknownOptionSelected: () => boolean;
    /**
     * @ngdoc method
     * @name select.SelectController#$isEmptyOptionSelected
     *
     * @description
     *
     * Returns `true` if the select element has an empty option and this empty option is currently
     * selected. Returns `false` if the select element has no empty option or it is not selected.
     *
     */
    $isEmptyOptionSelected: () => boolean;
    selectUnknownOrEmptyOption: (value: any) => void;
    registerOption: (optionScope: any, optionElement: any, optionAttrs: any, interpolateValueFn: any, interpolateTextFn: any) => void;
}
declare namespace SelectController {
    let $inject: string[];
}
import { JQLite } from "../../shared/jqlite/jqlite";
export {};

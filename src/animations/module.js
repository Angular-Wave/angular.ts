import { $$AnimateChildrenDirective } from "./animate-children-directive";
import { $$AnimationProvider } from "./animation";
import { $$rAFSchedulerFactory } from "./raf-scheduler";
import { ngAnimateSwapDirective } from "./animate-swap";
import { $$AnimateQueueProvider } from "./animate-queue";
import { $$AnimateCacheProvider } from "./animate-cache";
import { $AnimateCssProvider } from "./animate-css";
import { $$AnimateCssDriverProvider } from "./animate-css-driver";
import { $$AnimateJsProvider } from "./animate-js";
import { $$AnimateJsDriverProvider } from "./animate-js-driver";

export function initAnimateModule() {
  window["angular"]
    .module("ngAnimate", [])
    .directive("ngAnimateSwap", ngAnimateSwapDirective)
    .directive("ngAnimateChildren", $$AnimateChildrenDirective)
    .factory("$$rAFScheduler", $$rAFSchedulerFactory)
    .provider("$$animateQueue", $$AnimateQueueProvider)
    .provider("$$animateCache", $$AnimateCacheProvider)
    .provider("$$animation", $$AnimationProvider)
    .provider("$animateCss", $AnimateCssProvider)
    .provider("$$animateCssDriver", $$AnimateCssDriverProvider)
    .provider("$$animateJs", $$AnimateJsProvider)
    .provider("$$animateJsDriver", $$AnimateJsDriverProvider);
}

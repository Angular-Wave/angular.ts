export * from "./services/http/interface.ts";
export * from "./services/log/interface.ts";
export * from "./services/log/log.js";
export * from "./services/location/interface.ts";
export * from "./services/location/location.js";
export * from "./services/pubsub/pubsub.js";
export * from "./services/template-cache/interface.ts";
export * from "./services/template-cache/template-cache.js";
export * from "./index.js";

import { Angular } from "./angular.js";
import { Attributes } from "./core/compile/attributes.js";
import { Scope } from "./core/scope/scope.js";
import { NgModule } from "./core/di/ng-module.js";
import { PubSubProvider, PubSub } from "./services/pubsub/pubsub.js";
import type { ErrorHandlingConfig as iErrorHandlingConfig } from "./shared/interface.ts";

declare global {
  interface Function {
    $inject?: readonly string[] | undefined;
  }

  namespace ng {
    type Angular = InstanceType<typeof Angular>;
    type Attributes = InstanceType<typeof Attributes>;
    type Scope = InstanceType<typeof Scope>;
    type NgModule = InstanceType<typeof NgModule>;
    type PubSubProvider = InstanceType<typeof PubSubProvider>;
    type PubSub = InstanceType<typeof PubSub>;
    type ErrorHandlingConfig = iErrorHandlingConfig;
  }
}

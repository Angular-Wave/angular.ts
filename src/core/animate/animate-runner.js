import { forEach } from "../../shared/utils";

export function AnimateAsyncRunFactoryProvider() {
  this.$get = [
    function () {
      var waitQueue = [];

      function waitForTick(fn) {
        waitQueue.push(fn);
        if (waitQueue.length > 1) return;
        window.requestAnimationFrame(function () {
          for (var i = 0; i < waitQueue.length; i++) {
            waitQueue[i]();
          }
          waitQueue = [];
        });
      }

      return function () {
        var passed = false;
        waitForTick(function () {
          passed = true;
        });
        return function (callback) {
          if (passed) {
            callback();
          } else {
            waitForTick(callback);
          }
        };
      };
    },
  ];
}

export function AnimateRunnerFactoryProvider() {
  this.$get = [
    "$q",
    "$$animateAsyncRun",
    "$$isDocumentHidden",
    "$timeout",
    function ($q, $$animateAsyncRun, $$isDocumentHidden, $timeout) {
      const INITIAL_STATE = 0;
      const DONE_PENDING_STATE = 1;
      const DONE_COMPLETE_STATE = 2;

      AnimateRunner.chain = function (chain, callback) {
        let index = 0;

        next();
        function next() {
          if (index === chain.length) {
            callback(true);
            return;
          }

          chain[index]((response) => {
            if (response === false) {
              callback(false);
              return;
            }
            index++;
            next();
          });
        }
      };

      AnimateRunner.all = function (runners, callback) {
        let count = 0;
        let status = true;
        forEach(runners, (runner) => {
          runner.done(onProgress);
        });

        function onProgress(response) {
          status = status && response;
          if (++count === runners.length) {
            callback(status);
          }
        }
      };

      function AnimateRunner(host) {
        this.setHost(host);

        const rafTick = $$animateAsyncRun();
        const timeoutTick = function (fn) {
          $timeout(fn, 0, false);
        };

        this._doneCallbacks = [];
        this._tick = function (fn) {
          if ($$isDocumentHidden()) {
            timeoutTick(fn);
          } else {
            rafTick(fn);
          }
        };
        this._state = 0;
      }

      AnimateRunner.prototype = {
        setHost(host) {
          this.host = host || {};
        },

        done(fn) {
          if (this._state === DONE_COMPLETE_STATE) {
            fn();
          } else {
            this._doneCallbacks.push(fn);
          }
        },

        progress: () => {},

        getPromise() {
          if (!this.promise) {
            const self = this;
            this.promise = $q((resolve, reject) => {
              self.done((status) => {
                if (status === false) {
                  reject();
                } else {
                  resolve();
                }
              });
            });
          }
          return this.promise;
        },

        then(resolveHandler, rejectHandler) {
          return this.getPromise().then(resolveHandler, rejectHandler);
        },

        catch(handler) {
          return this.getPromise().catch(handler);
        },

        finally(handler) {
          return this.getPromise().finally(handler);
        },

        pause() {
          if (this.host.pause) {
            this.host.pause();
          }
        },

        resume() {
          if (this.host.resume) {
            this.host.resume();
          }
        },

        end() {
          if (this.host.end) {
            this.host.end();
          }
          this._resolve(true);
        },

        cancel() {
          if (this.host.cancel) {
            this.host.cancel();
          }
          this._resolve(false);
        },

        complete(response) {
          const self = this;
          if (self._state === INITIAL_STATE) {
            self._state = DONE_PENDING_STATE;
            self._tick(() => {
              self._resolve(response);
            });
          }
        },

        _resolve(response) {
          if (this._state !== DONE_COMPLETE_STATE) {
            forEach(this._doneCallbacks, (fn) => {
              fn(response);
            });
            this._doneCallbacks.length = 0;
            this._state = DONE_COMPLETE_STATE;
          }
        },
      };

      return AnimateRunner;
    },
  ];
}

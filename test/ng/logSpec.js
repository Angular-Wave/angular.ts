/* global $LogProvider: false */

describe("$log", () => {
  let $window;
  let logger;
  let log;
  let warn;
  let info;
  let error;
  let debug;

  beforeEach(
    module(($provide) => {
      $window = {
        navigator: { userAgent: window.navigator.userAgent },
        document: {},
      };
      logger = "";
      log = function () {
        logger += "log;";
      };
      warn = function () {
        logger += "warn;";
      };
      info = function () {
        logger += "info;";
      };
      error = function () {
        logger += "error;";
      };
      debug = function () {
        logger += "debug;";
      };

      $provide.provider("$log", $LogProvider);
      $provide.value("$exceptionHandler", angular.mock.rethrow);
      $provide.value("$window", $window);
    }),
  );

  it("should use console if present", inject(
    () => {
      $window.console = { log, warn, info, error, debug };
    },
    ($log) => {
      $log.log();
      $log.warn();
      $log.info();
      $log.error();
      $log.debug();
      expect(logger).toEqual("log;warn;info;error;debug;");
    },
  ));

  it("should use console.log() if other not present", inject(
    () => {
      $window.console = { log };
    },
    ($log) => {
      $log.log();
      $log.warn();
      $log.info();
      $log.error();
      $log.debug();
      expect(logger).toEqual("log;log;log;log;log;");
    },
  ));

  it("should use () => {} if no console", inject(($log) => {
    $log.log();
    $log.warn();
    $log.info();
    $log.error();
    $log.debug();
  }));

  runTests({ ie9Mode: false });
  runTests({ ie9Mode: true });

  function runTests(options) {
    function attachMockConsoleTo$window() {
      $window.console = {
        log,
        warn,
        info,
        error,
        debug,
      };
    }

    describe(
      ie9Mode ? "IE 9 logging behavior" : "Modern browsers' logging behavior",
      () => {
        beforeEach(module(attachMockConsoleTo$window));

        it("should work if $window.navigator not defined", inject(
          () => {
            delete $window.navigator;
          },
          ($log) => {},
        ));

        it("should have a working apply method", inject(($log) => {
          $log.log.apply($log);
          $log.warn.apply($log);
          $log.info.apply($log);
          $log.error.apply($log);
          $log.debug.apply($log);
          expect(logger).toEqual("log;warn;info;error;debug;");
        }));

        it("should not attempt to log the second argument in IE if it is not specified", inject(
          () => {
            log = function (arg1, arg2) {
              logger += `log,${arguments.length};`;
            };
            warn = function (arg1, arg2) {
              logger += `warn,${arguments.length};`;
            };
            info = function (arg1, arg2) {
              logger += `info,${arguments.length};`;
            };
            error = function (arg1, arg2) {
              logger += `error,${arguments.length};`;
            };
            debug = function (arg1, arg2) {
              logger += `debug,${arguments.length};`;
            };
          },
          attachMockConsoleTo$window,
          ($log) => {
            $log.log();
            $log.warn();
            $log.info();
            $log.error();
            $log.debug();
            expect(logger).toEqual("log,0;warn,0;info,0;error,0;debug,0;");
          },
        ));

        describe("$log.debug", () => {
          beforeEach(initService(false));

          it("should skip debugging output if disabled", inject(
            () => {
              $window.console = { log, warn, info, error, debug };
            },
            ($log) => {
              $log.log();
              $log.warn();
              $log.info();
              $log.error();
              $log.debug();
              expect(logger).toEqual("log;warn;info;error;");
            },
          ));
        });

        describe("$log.error", () => {
          let e;
          let $log;

          function TestError() {
            Error.prototype.constructor.apply(this, arguments);
            this.message = undefined;
            this.sourceURL = undefined;
            this.line = undefined;
            this.stack = undefined;
          }
          TestError.prototype = Object.create(Error.prototype);
          TestError.prototype.constructor = TestError;

          beforeEach(inject(
            () => {
              e = new TestError("");
              $window.console = {
                error: jasmine.createSpy("error"),
              };
            },

            (_$log_) => {
              $log = _$log_;
            },
          ));

          it("should pass error if does not have trace", () => {
            $log.error("abc", e);
            expect($window.console.error).toHaveBeenCalledWith("abc", e);
          });

          it("should print a raw error", () => {
            e.stack = "stack";
            $log.error("abc", e);
            expect($window.console.error).toHaveBeenCalledWith("abc", e);
          });

          it("should print line", () => {
            e.message = "message";
            e.sourceURL = "sourceURL";
            e.line = "123";
            $log.error("abc", e);
            expect($window.console.error).toHaveBeenCalledWith(
              "abc",
              "message\nsourceURL:123",
            );
          });
        });
      },
    );
  }

  function initService(debugEnabled) {
    return module(($logProvider) => {
      $logProvider.debugEnabled(debugEnabled);
    });
  }
});

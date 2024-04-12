/**
 * @ngdoc module
 * @name ngParseExt
 * @packageName angular-parse-ext
 *
 * @description
 *
 * The `ngParseExt` module provides functionality to allow Unicode characters in
 * identifiers inside AngularJS expressions.
 *
 * This module allows the usage of any identifier that follows ES6 identifier naming convention
 * to be used as an identifier in an AngularJS expression. ES6 delegates some of the identifier
 * rules definition to Unicode, this module uses ES6 and Unicode 8.0 identifiers convention.
 *
 * <div class="alert alert-warning">
 * You cannot use Unicode characters for variable names in the {@link ngRepeat} or {@link ngOptions}
 * expressions (e.g. `ng-repeat="f in поля"`), because even with `ngParseExt` included, these
 * special expressions are not parsed by the {@link $parse} service.
 * </div>
 */

import { IDC_Y, IDS_Y } from "./ucd";

function isValidIdentifierStart(ch, cp) {
  return ch === "$" || ch === "_" || IDS_Y(cp);
}

function isValidIdentifierContinue(ch, cp) {
  return (
    ch === "$" ||
    ch === "_" ||
    cp === 0x200c || // <ZWNJ>
    cp === 0x200d || // <ZWJ>
    IDC_Y(cp)
  );
}

angular
  .module("ngParseExt", [])
  .config([
    "$parseProvider",
    function ($parseProvider) {
      $parseProvider.setIdentifierFns(
        isValidIdentifierStart,
        isValidIdentifierContinue,
      );
    },
  ])
  .info({ angularVersion: '"NG_VERSION_FULL"' });

runBlock.$inject = ["$urlService"];
/**
 * @param {*} $urlService
 */
export function runBlock($urlService) {
  // Start listening for url changes
  $urlService.listen();
}

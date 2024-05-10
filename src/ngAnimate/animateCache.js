const KEY = "$$ngAnimateParentKey";
let parentCounter = 0;
let cache = Object.create(null);

export function animateCache() {
  return {
    cacheKey(node, method, addClass, removeClass) {
      const { parentNode } = node;
      const parentID = parentNode[KEY] || (parentNode[KEY] = ++parentCounter);
      const parts = [parentID, method, node.getAttribute("class")];
      if (addClass) {
        parts.push(addClass);
      }
      if (removeClass) {
        parts.push(removeClass);
      }
      return parts.join(" ");
    },

    containsCachedAnimationWithoutDuration(key) {
      const entry = cache[key];

      // nothing cached, so go ahead and animate
      // otherwise it should be a valid animation
      return (entry && !entry.isValid) || false;
    },

    flush() {
      cache = Object.create(null);
    },

    count(key) {
      const entry = cache[key];
      return entry ? entry.total : 0;
    },

    get(key) {
      const entry = cache[key];
      return entry && entry.value;
    },

    put(key, value, isValid) {
      if (!cache[key]) {
        cache[key] = { total: 1, value, isValid };
      } else {
        cache[key].total++;
        cache[key].value = value;
      }
    },
  };
}

export function $$AnimateCacheProvider() {
  this.$get = [animateCache];
}

import { publishExternalAPI } from "../../public";
import { createInjector } from "../../injector";

describe("$cacheFactory", () => {
  let $cacheFactory;

  beforeEach(() => {
    publishExternalAPI();
    createInjector(["ng"]).invoke((_$cacheFactory_) => {
      $cacheFactory = _$cacheFactory_;
    });
  });

  it("should be injected", () => {
    expect($cacheFactory).toBeDefined();
  });

  it("should return a new cache whenever called", () => {
    const cache1 = $cacheFactory("cache1");
    const cache2 = $cacheFactory("cache2");
    expect(cache1).not.toEqual(cache2);
  });

  it("should complain if the cache id is being reused", () => {
    $cacheFactory("cache1");
    expect(() => {
      $cacheFactory("cache1");
    }).toThrowError(/iid/);
  });

  describe("info", () => {
    it("should provide info about all created caches", () => {
      expect($cacheFactory.info()).toEqual({});

      const cache1 = $cacheFactory("cache1");
      expect($cacheFactory.info()).toEqual({
        cache1: { id: "cache1", size: 0 },
      });

      cache1.put("foo", "bar");
      expect($cacheFactory.info()).toEqual({
        cache1: { id: "cache1", size: 1 },
      });
    });
  });

  describe("get", () => {
    it("should return a cache if looked up by id", () => {
      const cache1 = $cacheFactory("cache1");
      const cache2 = $cacheFactory("cache2");

      expect(cache1).not.toBe(cache2);
      expect(cache1).toBe($cacheFactory.get("cache1"));
      expect(cache2).toBe($cacheFactory.get("cache2"));
    });
  });

  describe("cache", () => {
    let cache;

    beforeEach(() => {
      cache = $cacheFactory("test");
    });

    describe("put, get & remove", () => {
      it("should add cache entries via add and retrieve them via get", () => {
        cache.put("key1", "bar");
        cache.put("key2", { bar: "baz" });

        expect(cache.get("key2")).toEqual({ bar: "baz" });
        expect(cache.get("key1")).toBe("bar");
      });

      it("should ignore put if the value is undefined", () => {
        cache.put();
        cache.put("key1");
        cache.put("key2", undefined);

        expect(cache.info().size).toBe(0);
      });

      it("should remove entries via remove", () => {
        cache.put("k1", "foo");
        cache.put("k2", "bar");

        cache.remove("k2");

        expect(cache.get("k1")).toBe("foo");
        expect(cache.get("k2")).toBeUndefined();

        cache.remove("k1");

        expect(cache.get("k1")).toBeUndefined();
        expect(cache.get("k2")).toBeUndefined();
      });

      it("should return undefined when entry does not exist", () => {
        expect(cache.remove("non-existent")).toBeUndefined();
      });

      it("should stringify keys", () => {
        cache.put("123", "foo");
        cache.put(123, "bar");

        expect(cache.get("123")).toBe("bar");
        expect(cache.info().size).toBe(1);

        cache.remove(123);
        expect(cache.info().size).toBe(0);
      });

      it("should return value from put", () => {
        const obj = {};
        expect(cache.put("k1", obj)).toBe(obj);
      });
    });

    describe("info", () => {
      it("should size increment with put and decrement with remove", () => {
        expect(cache.info().size).toBe(0);

        cache.put("foo", "bar");
        expect(cache.info().size).toBe(1);

        cache.put("baz", "boo");
        expect(cache.info().size).toBe(2);

        cache.remove("baz");
        expect(cache.info().size).toBe(1);

        cache.remove("foo");
        expect(cache.info().size).toBe(0);
      });

      it("should only decrement size when an element is actually removed via remove", () => {
        cache.put("foo", "bar");
        expect(cache.info().size).toBe(1);

        cache.remove("undefined");
        expect(cache.info().size).toBe(1);

        cache.remove("hasOwnProperty");
        expect(cache.info().size).toBe(1);

        cache.remove("foo");
        expect(cache.info().size).toBe(0);
      });

      it("should return cache id", () => {
        expect(cache.info().id).toBe("test");
      });
    });

    describe("removeAll", () => {
      it("should blow away all data", () => {
        cache.put("id1", 1);
        cache.put("id2", 2);
        cache.put("id3", 3);
        expect(cache.info().size).toBe(3);

        cache.removeAll();

        expect(cache.info().size).toBe(0);
        expect(cache.get("id1")).toBeUndefined();
        expect(cache.get("id2")).toBeUndefined();
        expect(cache.get("id3")).toBeUndefined();
      });
    });

    describe("destroy", () => {
      it("should make the cache unusable and remove references to it from $cacheFactory", () => {
        cache.put("foo", "bar");
        cache.destroy();

        expect(() => {
          cache.get("foo");
        }).toThrow();
        expect(() => {
          cache.get("neverexisted");
        }).toThrow();
        expect(() => {
          cache.put("foo", "bar");
        }).toThrow();

        expect($cacheFactory.get("test")).toBeUndefined();
        expect($cacheFactory.info()).toEqual({});
      });
    });
  });

  describe("LRU cache", () => {
    it("should create cache with defined capacity", () => {
      const cache = $cacheFactory("cache1", { capacity: 5 });
      expect(cache.info().size).toBe(0);

      for (let i = 0; i < 5; i++) {
        cache.put(`id${i}`, i);
      }

      expect(cache.info().size).toBe(5);

      cache.put("id5", 5);
      expect(cache.info().size).toBe(5);
      cache.put("id6", 6);
      expect(cache.info().size).toBe(5);
    });

    describe("eviction", () => {
      let cache;

      beforeEach(() => {
        cache = $cacheFactory("cache1", { capacity: 2 });

        cache.put("id0", 0);
        cache.put("id1", 1);
      });

      it("should kick out the first entry on put", () => {
        cache.put("id2", 2);
        expect(cache.get("id0")).toBeUndefined();
        expect(cache.get("id1")).toBe(1);
        expect(cache.get("id2")).toBe(2);
      });

      it("should refresh an entry via get", () => {
        cache.get("id0");
        cache.put("id2", 2);
        expect(cache.get("id0")).toBe(0);
        expect(cache.get("id1")).toBeUndefined();
        expect(cache.get("id2")).toBe(2);
      });

      it("should refresh an entry via put", () => {
        cache.put("id0", "00");
        cache.put("id2", 2);
        expect(cache.get("id0")).toBe("00");
        expect(cache.get("id1")).toBeUndefined();
        expect(cache.get("id2")).toBe(2);
      });

      it("should not purge an entry if another one was removed", () => {
        cache.remove("id1");
        cache.put("id2", 2);
        expect(cache.get("id0")).toBe(0);
        expect(cache.get("id1")).toBeUndefined();
        expect(cache.get("id2")).toBe(2);
      });

      it("should purge the next entry if the stalest one was removed", () => {
        cache.remove("id0");
        cache.put("id2", 2);
        cache.put("id3", 3);
        expect(cache.get("id0")).toBeUndefined();
        expect(cache.get("id1")).toBeUndefined();
        expect(cache.get("id2")).toBe(2);
        expect(cache.get("id3")).toBe(3);
      });

      it("should correctly recreate the linked list if all cache entries were removed", () => {
        cache.remove("id0");
        cache.remove("id1");
        cache.put("id2", 2);
        cache.put("id3", 3);
        cache.put("id4", 4);
        expect(cache.get("id0")).toBeUndefined();
        expect(cache.get("id1")).toBeUndefined();
        expect(cache.get("id2")).toBeUndefined();
        expect(cache.get("id3")).toBe(3);
        expect(cache.get("id4")).toBe(4);
      });

      it("should blow away the entire cache via removeAll and start evicting when full", () => {
        cache.put("id0", 0);
        cache.put("id1", 1);
        cache.removeAll();

        cache.put("id2", 2);
        cache.put("id3", 3);
        cache.put("id4", 4);

        expect(cache.info().size).toBe(2);
        expect(cache.get("id0")).toBeUndefined();
        expect(cache.get("id1")).toBeUndefined();
        expect(cache.get("id2")).toBeUndefined();
        expect(cache.get("id3")).toBe(3);
        expect(cache.get("id4")).toBe(4);
      });

      it("should correctly refresh and evict items if operations are chained", () => {
        cache = $cacheFactory("cache2", { capacity: 3 });

        cache.put("id0", 0); // 0
        cache.put("id1", 1); // 1,0
        cache.put("id2", 2); // 2,1,0
        cache.get("id0"); // 0,2,1
        cache.put("id3", 3); // 3,0,2
        cache.put("id0", 9); // 0,3,2
        cache.put("id4", 4); // 4,0,3

        expect(cache.get("id3")).toBe(3);
        expect(cache.get("id0")).toBe(9);
        expect(cache.get("id4")).toBe(4);

        cache.remove("id0"); // 4,3
        cache.remove("id3"); // 4
        cache.put("id5", 5); // 5,4
        cache.put("id6", 6); // 6,5,4
        cache.get("id4"); // 4,6,5
        cache.put("id7", 7); // 7,4,6

        expect(cache.get("id0")).toBeUndefined();
        expect(cache.get("id1")).toBeUndefined();
        expect(cache.get("id2")).toBeUndefined();
        expect(cache.get("id3")).toBeUndefined();
        expect(cache.get("id4")).toBe(4);
        expect(cache.get("id5")).toBeUndefined();
        expect(cache.get("id6")).toBe(6);
        expect(cache.get("id7")).toBe(7);

        cache.removeAll();
        cache.put("id0", 0); // 0
        cache.put("id1", 1); // 1,0
        cache.put("id2", 2); // 2,1,0
        cache.put("id3", 3); // 3,2,1

        expect(cache.info().size).toBe(3);
        expect(cache.get("id0")).toBeUndefined();
        expect(cache.get("id1")).toBe(1);
        expect(cache.get("id2")).toBe(2);
        expect(cache.get("id3")).toBe(3);
      });
    });
  });
});

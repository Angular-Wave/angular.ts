import { pushTo } from "../../shared/common.js";

export class Queue {
  constructor(_items = [], _limit = null) {
    this._items = _items;
    this._limit = _limit;
    this._evictListeners = [];
    this.onEvict = pushTo(this._evictListeners);
  }

  enqueue(item) {
    const items = this._items;
    items.push(item);
    if (this._limit && items.length > this._limit) this.evict();
    return item;
  }

  evict() {
    const item = this._items.shift();
    this._evictListeners.forEach((fn) => fn(item));
    return item;
  }

  dequeue() {
    if (this.size()) return this._items.splice(0, 1)[0];
  }

  clear() {
    const current = this._items;
    this._items = [];
    return current;
  }

  size() {
    return this._items.length;
  }

  remove(item) {
    const idx = this._items.indexOf(item);
    return idx > -1 && this._items.splice(idx, 1)[0];
  }

  peekTail() {
    return this._items[this._items.length - 1];
  }

  peekHead() {
    if (this.size()) return this._items[0];
  }
}

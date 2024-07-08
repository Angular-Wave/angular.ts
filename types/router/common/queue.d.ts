export class Queue {
  constructor(_items?: any[], _limit?: any);
  _items: any[];
  _limit: any;
  _evictListeners: any[];
  onEvict: any;
  enqueue(item: any): any;
  evict(): any;
  dequeue(): any;
  clear(): any[];
  size(): number;
  remove(item: any): any;
  peekTail(): any;
  peekHead(): any;
}

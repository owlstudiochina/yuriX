"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports._createState = void 0;
var _rxjs = require("rxjs");
var _immer = require("immer");
/**
 * State
 * - 可获取当前的state
 * - 多种方式设置state
 * - 可订阅state变化（包含prev和next的state）, 随时可取消订阅
 */
const _createState = () => {
  let _state = {};
  let _subOb = new _rxjs.Subject();
  return {
    getState: () => _state,
    setState: (...args) => {
      if (args.length === 0) {
        throw new Error("setState必须传入参数");
      }
      const isStateArgs = () => args.length === 1 && typeof args[0] !== 'function';
      const isStateFuncArgs = () => typeof args[0] === 'function';

      // setState直接传入state设置的
      if (isStateArgs()) {
        const prev = (0, _immer.produce)(_state, draft => {});
        const next = {
          ...args[0]
        };
        _state = next;
        _subOb.next([prev, next]);
        return;
      }
      // setState传入(state, ...args)=>{}函数，和对应...args的参数的
      if (isStateFuncArgs()) {
        const hasArgs = () => args.length > 1;
        const getNextState = () => {
          const cb = args[0];
          if (hasArgs()) {
            const _args = args.slice(1);
            return (0, _immer.produce)(cb)(_state, ..._args);
          } else {
            return (0, _immer.produce)(_state, draft => {
              cb(draft);
            });
          }
        };
        const prev = _state;
        const next = getNextState();
        _state = next;
        _subOb.next([prev, next]);
      }
    },
    // 订阅state变化。可获得变化前prev和变化后的next的state。
    // 返回的方法调用则取消订阅
    subscribe: cb => {
      const sub = _subOb.subscribe(([prev, next]) => {
        if (cb) {
          cb(prev, next);
        }
      });
      // 返回取消订阅的函数
      return () => {
        sub.unsubscribe();
      };
    }
  };
};
exports._createState = _createState;
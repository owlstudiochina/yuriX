"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.createEffector = void 0;
var _rxjs = require("rxjs");
var _operators = require("rxjs/operators");
const createEffector = () => {
  const stopOb = new _rxjs.Subject();
  const stopErr = new Error("pipe被停止了");
  return {
    pipe: (...operators) => {
      if (!operators || operators.length === 0) {
        return Promise.reject(new Error("operators必须是长度大于1的数租"));
      }
      return new Promise((resolve, reject) => {
        const res = [];
        let hasBeStop = false;
        const sub = stopOb.subscribe(() => {
          hasBeStop = true;
        });
        (0, _rxjs.of)(undefined).pipe(...operators, (0, _operators.takeUntil)(stopOb) // 停止所有effect执行
        ).subscribe({
          next: v => {
            res.push(v);
          },
          error: err => {
            sub.unsubscribe();
            reject(err);
          },
          complete: () => {
            sub.unsubscribe();
            if (hasBeStop) {
              reject(stopErr);
              return;
            }
            //
            if (res.length === 0) {
              resolve();
            } else if (res.length === 1) {
              resolve(res[0]);
            } else {
              resolve(res);
            }
          }
        });
      });
    },
    stopAllPipes: () => {
      stopOb.next(undefined);
    },
    isStopError: err => {
      return err === stopErr;
    }
  };
};
exports.createEffector = createEffector;
"use strict";

var _rxjs = require("rxjs");
var _operators = require("rxjs/operators");
var _effector = require("../effector");
describe("createEffector", () => {
  describe("pipe", () => {
    it('传入2个operator，应都被执行', async () => {
      const callback = jest.fn();
      const effector = (0, _effector.createEffector)();
      await effector.pipe((0, _operators.tap)(callback), (0, _operators.tap)(callback));
      // 2个operator被调用，callback执行2次
      expect(callback.mock.calls.length).toBe(2);
    });
    it('pipe不传入参数，应报错', async () => {
      const effector = (0, _effector.createEffector)();
      await expect(effector.pipe()).rejects.toThrowError();
    });
    it('pipe传入长度为0的operators，应报错', async () => {
      const effector = (0, _effector.createEffector)();
      await expect(effector.pipe([])).rejects.toThrowError();
    });
    it('pipe传入非operator，应报错', async () => {
      const effector = (0, _effector.createEffector)();
      await expect(effector.pipe(() => {})).rejects.toThrowError();
    });
    it('pipe传入的operator发出一个值，pipe的then方法应该能接收这个值', async () => {
      const effector = (0, _effector.createEffector)();
      const res = await effector.pipe((0, _operators.concatMap)(() => (0, _rxjs.of)("value")));
      expect(res).toEqual("value");
    });
    it('pipe传入的operator发出多个值，pipe的then方法应该能接收包含此多值数组', async () => {
      const effector = (0, _effector.createEffector)();
      const res = await effector.pipe((0, _operators.concatMap)(() => (0, _rxjs.range)(0, 5)));
      expect(res).toEqual([0, 1, 2, 3, 4]);
    });
    it('传入operator执行报错，应该pipe报错', async () => {
      const effector = (0, _effector.createEffector)();
      await expect(effector.pipe((0, _operators.tap)(() => {
        throw new Error();
      }))).rejects.toThrowError();
    });
  });
  describe("stopAllPipes", () => {
    it('一个延迟100毫秒的pipe，停止后，其应停止执行。且会报出停止的错误', async () => {
      const callback = jest.fn();
      const catchCallback = jest.fn();
      const effector = (0, _effector.createEffector)();
      setTimeout(() => {
        effector.stopAllPipes();
      }, 5);
      const pipe = () => effector.pipe((0, _operators.tap)(callback));
      const delayPipe = () => {
        return effector.pipe((0, _operators.tap)(callback), (0, _operators.delay)(100), (0, _operators.tap)(callback)).catch(err => {
          catchCallback(err);
        });
      };
      await Promise.all([pipe(), delayPipe()]);
      expect(callback.mock.calls.length).toBe(2);
      expect(effector.isStopError(catchCallback.mock.calls[0][0])).toBeTruthy();
    });
    it('pipe已经执行结束，调用stopAllPipes，应不会报错', async () => {
      const callback = jest.fn();
      const catchCallback = jest.fn();
      const effector = (0, _effector.createEffector)();
      const delayPipe = () => {
        return effector.pipe((0, _operators.tap)(callback), (0, _operators.delay)(10), (0, _operators.tap)(callback)).catch(err => {
          catchCallback(err);
        });
      };
      setTimeout(() => {
        effector.stopAllPipes();
      }, 20);
      await delayPipe();
      expect(callback.mock.calls.length).toBe(2);
      expect(catchCallback.mock.calls.length).toBe(0);
    });
  });
});
"use strict";

var _pipe = require("../pipe");
var _rxjs = require("rxjs");
var _operators = require("rxjs/operators");
describe("pipe", () => {
  /**
   * 传入operators
   */

  test("传入1个operator，其应执行", async () => {
    const callback = jest.fn();
    await (0, _pipe.pipe)((0, _rxjs.tap)(callback));
    expect(callback.mock.calls.length).toBe(1);
  });
  test("传入多个operator，其应执行", async () => {
    const callback = jest.fn();
    await (0, _pipe.pipe)((0, _rxjs.tap)(callback), (0, _rxjs.tap)(callback));
    expect(callback.mock.calls.length).toBe(2);
  });
  test("不传入operator，其应reject报错", async () => {
    await expect((0, _pipe.pipe)()).rejects.toThrowError();
  });

  /**
   * 传入非operator
   */

  test("传入空数组，其应报错", async () => {
    await expect(() => {
      (0, _pipe.pipe)([]);
    }).toThrowError();
  });
  test("传入1个非operator，其应报错", async () => {
    const callback = jest.fn();
    expect(() => {
      (0, _pipe.pipe)(1);
    }).toThrowError();
  });

  /**
   * 获取多个值
   */

  test("传入operators发出一个值，其应执行且获得此值", async () => {
    const res = await (0, _pipe.pipe)((0, _operators.concatMap)(() => (0, _rxjs.of)("value")));
    expect(res).toEqual("value");
  });
  test("传入operators发出多个值，其应执行且获得此值的数组", async () => {
    const res = await (0, _pipe.pipe)((0, _operators.concatMap)(() => (0, _rxjs.range)(0, 5)));
    expect(res).toEqual([0, 1, 2, 3, 4]);
  });

  /***
   * 执行operators过程报错，应该能catch到错误。
   */

  test("执行operators出错，应该能catch到错误", async () => {
    await expect((0, _pipe.pipe)((0, _rxjs.tap)(() => {
      throw new Error();
    }))).rejects.toThrowError();
  });
});
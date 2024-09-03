"use strict";

var _state = require("../state");
describe("_createState", () => {
  describe('setState, 不同方式设置state值', () => {
    it('直接传入state值', function () {
      const state = (0, _state._createState)();
      state.setState({
        value: 0
      });
      expect(state.getState()).toEqual({
        value: 0
      });
    });
    it('cb只有一个state参数', function () {
      const state = (0, _state._createState)();
      state.setState(state => {
        state.value = 0;
      });
      expect(state.getState()).toEqual({
        value: 0
      });
    });
    it('cb除一个state参数，还有多个其他参数', function () {
      const state = (0, _state._createState)();
      state.setState(state => {
        state.value = 0;
      });
      const inc = (state, step) => {
        state.value += step;
      };
      const step = 1;
      state.setState(inc, step); // 多个参数
      expect(state.getState()).toEqual({
        value: 1
      });
    });
  });
  describe("getState, 获取state值", () => {
    it('设置state，获取后相等', function () {
      const state = (0, _state._createState)();
      state.setState({
        value: 0
      });
      expect(state.getState()).toEqual({
        value: 0
      });
    });
  });
  describe("subscribe，订阅state的变化", () => {
    it('订阅，能获取变化前后的state', function () {
      const state = (0, _state._createState)();
      const spySub = jest.fn();
      const unsubscribe = state.subscribe(spySub);
      state.setState(state => {
        state.value = 0;
      });
      //
      const callArgs = spySub.mock.calls[0];
      const [prev, next] = [callArgs[0], callArgs[1]];
      expect(spySub.mock.calls).toHaveLength(1);
      expect(prev).toEqual({});
      expect(next).toEqual({
        value: 0
      });
      unsubscribe();
    });
    it('取消订阅，则回调不在被调用', function () {
      const state = (0, _state._createState)();
      const spySub = jest.fn();
      const unsubscribe = state.subscribe(spySub);
      state.setState(state => {
        state.value = 0;
      });
      //
      expect(spySub.mock.calls).toHaveLength(1);
      unsubscribe();
      state.setState(state => {
        state.value = 1;
      });
      expect(spySub.mock.calls).toHaveLength(1);
    });
  });
});
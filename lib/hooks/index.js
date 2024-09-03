"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.useModel = void 0;
var _react = require("react");
var _rxjs = require("rxjs");
var _state2 = require("../state/state");
var _effector = require("../utils/effector");
/**
 * 实现：
 * - createModel创建model
 * - model包含state和effector和sync
 *    - state是model的状态
 *    - effector方便配合rxjs操作符编写业务逻辑，
 *    - sync是rxjs的Subject，用于发出组件已同步的state。
 */
const useModel = createModelFunc => {
  const m = (0, _react.useMemo)(() => createModel(createModelFunc), []);
  // model的state同步到组件
  const state = (0, _react.useSyncExternalStore)(m.subscribe, m.getState);

  // 监听组件的完成了同步state，并且通知到model中的sync。组件卸载则停止同步。
  (0, _react.useEffect)(() => {
    m.syncState(state);
  }, [state]);
  (0, _react.useEffect)(() => {
    return () => {
      m.syncStop();
    };
  }, []);
  return {
    ...m,
    state
  };
};
exports.useModel = useModel;
const createModel = createModelFunc => {
  const checkCreateModelFuncIsFunc = () => {
    if (typeof createModelFunc !== 'function') {
      throw new Error("传入的createModelFunc必须是函数");
    }
  };
  checkCreateModelFuncIsFunc();
  const isFuncReturn = () => createModelFunc.length === 0;
  createModelFunc = isFuncReturn() ? createModelFunc() : createModelFunc;
  let _model;
  let _state = (0, _state2._createState)();
  let _syncState = new _rxjs.Subject();
  const isNeedEffector = () => createModelFunc.length === 2;
  let modelFuncArgs = [{
    set: _state.setState,
    get: _state.getState,
    sync: _syncState
  }];
  if (isNeedEffector()) {
    modelFuncArgs = [...modelFuncArgs, (0, _effector.createEffector)()];
  }
  _model = createModelFunc(...modelFuncArgs);
  _state.setState(_model.state);
  return {
    ..._model,
    state: _state,
    getState: () => _state.getState(),
    subscribe: cb => _state.subscribe(cb),
    syncState: state => {
      _syncState.next(state);
    },
    syncStop: () => {
      _syncState.complete();
    }
  };
};
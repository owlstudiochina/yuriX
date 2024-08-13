import {useEffect, useMemo, useSyncExternalStore} from "react";
import {Subject} from "rxjs";
import {_createState} from "../state/state";
import {createEffector} from "../utils/effector";

/**
 * 实现：
 * - createModel创建model
 * - model包含state和effector和sync
 *    - state是model的状态
 *    - effector方便配合rxjs操作符编写业务逻辑，
 *    - sync是rxjs的Subject，用于发出组件已同步的state。
 */
export const useModel = (createModelFunc)=>{

  const m = useMemo(()=> createModel(createModelFunc), [])
  // model的state同步到组件
  const state =  useSyncExternalStore(m.subscribe, m.getState)

  // 监听组件的完成了同步state，并且通知到model中的sync。组件卸载则停止同步。
  useEffect(()=>{
    m.syncState(state);
  }, [state])

  useEffect(()=>{
    return ()=>{m.syncStop()}
  }, [])

  return {
    ...m,
    state,
  }
}



const createModel = (createModelFunc)=>{

  const checkCreateModelFuncIsFunc = ()=>{
    if (typeof createModelFunc !== 'function') {
      throw new Error("传入的createModelFunc必须是函数")
    }
  }
  checkCreateModelFuncIsFunc()

  const isFuncReturn = ()=> createModelFunc.length === 0;

  createModelFunc = isFuncReturn() ? createModelFunc() : createModelFunc;

  let _model;
  let _state = _createState();
  let _syncState = new Subject();

  const isNeedEffector = ()=> createModelFunc.length === 2;

  let modelFuncArgs  =  [
    {set: _state.setState, get: _state.getState, sync: _syncState}
  ]
  if(isNeedEffector()){
    modelFuncArgs = [...modelFuncArgs, createEffector()]
  }

  _model = createModelFunc(...modelFuncArgs);
  _state.setState(_model.state);

  return {
    ..._model,
    state: _state,
    getState: ()=> _state.getState(),
    subscribe: (cb)=> _state.subscribe(cb),

    syncState: (state)=>{_syncState.next(state)},
    syncStop: ()=>{_syncState.complete()},
  }

}



import {useMemo, useSyncExternalStore} from "react";
import {createModel} from "../model";

/**
 *
 * @param model 创建model的函数
 * @param {(any|function|undefined)}modelArgs model函数传入的参数
 */
export const useModel = (model, modelArgs = undefined)=>{

  const m = useMemo(()=> createModel(model, modelArgs), [])
  // model的state同步到组件
  const state =  useSyncExternalStore(m.subscribe, m.getState)

  return {
    ...m,
    state,
  }
}

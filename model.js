import {produce}  from "immer";
import {Subject} from "rxjs";
import {createEffector} from "./utils";


/**
 * State
 * - 可获取当前的state
 * - 多种方式设置state
 * - 可订阅state变化（包含prev和next的state）
 */
export const _createState = ()=>{

  let  _state = {};
  let _subOb = new Subject();

  return {
    getState: ()=> _state,

    setState: (...args)=>{
      if(args.length === 0){
        throw new Error("setState必须传入参数");
      }

      const isStateArgs = ()=>args.length === 1 && typeof args[0] !== 'function';

      const isStateFuncArgs = ()=>typeof args[0] === 'function';

      // setState直接传入state设置的
      if (isStateArgs()){
        const prev = produce(_state, (draft)=>{});
        const next =  {...args[0]}
        _state = next;
        _subOb.next([prev, next]);
        return;
      }
      // setState传入(state, ...args)=>{}函数，和对应...args的参数的
      if (isStateFuncArgs()){
        const hasArgs  = ()=> args.length > 1;

        const getNextState = ()=>{
          const cb = args[0];
          if (hasArgs()){
            const _args = args.slice(1);
            return produce(cb)(_state, ..._args)
          }else{
            return produce(_state, (draft)=>{
              cb(draft)
            })
          }
        }

        const prev = _state;
        const next = getNextState();
        _state = next;
        _subOb.next([prev, next]);
      }
    },

    // 订阅state变化。可获得变化前prev和变化后的next的state。
    subscribe: (cb)=>{
      const sub = _subOb.subscribe(([prev, next])=>{
        if(cb){cb(prev, next)}
      })
      // 返回取消订阅的函数
      return ()=> {sub.unsubscribe()}
    }
  }
}


/**
 *
 * @param model 创建model的函数
 * @param {(any|function|undefined)} modelArgs model函数传入的参数
 */
export const createModel = (model, modelArgs = undefined)=>{
  const _modelArgs = typeof modelArgs === 'function'? modelArgs() :modelArgs;
  const _modelFn = model(_modelArgs)

  let _model;
  let _state = _createState();

  const isJustSetAndGet = ()=> _modelFn.length === 1;
  const isNeedEffector = ()=> _modelFn.length === 2;

  //  是使用{set,get}
  if(isJustSetAndGet()) {
    _model = _modelFn({set: _state.setState, get: _state.getState});
  }else if(isNeedEffector()){// 使用 是使用{set,get}, effector
    _model = _modelFn({set: _state.setState, get: _state.getState}, createEffector());
  }else{
    throw new Error("创建model的方法，参数只能是({set,get})或({set.get}, effector)")
  }
  _state.setState(_model.state);

  return {
    ..._model,
    state: _state,

    getState: ()=> _state.getState(),
    subscribe: (cb)=> _state.subscribe(cb),
  }
}


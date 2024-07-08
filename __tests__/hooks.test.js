import {act, renderHook} from "@testing-library/react";
import {useEffect} from "react";
import {delay, tap} from "rxjs/operators";
import {useModel} from "../hooks";


describe("useModel", ()=>{

  describe("第一参数，即定义model", ()=>{
    it('定义一个简单累加的计数器model，其使用{set, get}', async () => {
      const counter = ()=> ({set, get})=>{
        return {
          state: {value: 0, step:  1},
          useCases: {
            inc: ()=> Promise.resolve(set((state)=> {state.value+= get().step})),
          }
        }
      };
      // Given: 用定义的model创建
      const {result} = renderHook(()=> useModel(counter))
      const getState = result.current.getState;
      const {useCases: {inc}} = result.current;
      expect(getState().value).toBe(0)
      // When: 调用加1
      await act(()=> inc())
      // Then: 值被成功加1
      expect(getState().value).toBe(1)
    });

    it('定义一个简单累加的计数器model，其使用{set, get}和{pipe, stopAllPipes}', async () => {
      const delayCounter = ()=> ({set, get}, {pipe, stopAllPipes})=>{
        return {
          state: {value: 0, step:  1},
          useCases: {
            delayInc: ()=> pipe(
              delay(100),
              tap(()=> set((state)=> {state.value+= get().step}))
            ),
          },
          stopAllPipes
        }
      };
      // Given: 用定义的model创建
      const {result} = renderHook(()=> useModel(delayCounter))

      const getState = result.current.getState;
      const {useCases: {delayInc}, stopAllPipes} = result.current;
      expect(getState().value).toBe(0)
      // When: 延迟100毫秒加1，但是中途5毫秒后被中止
      setTimeout(()=>{stopAllPipes()},5)
      await act(()=> delayInc().catch(()=>{}))
      // Then: 值未被加1
      expect(getState().value).toBe(0)
    });
  })

  describe("第二参数使用，即传入model的参数", ()=>{
    const counterModel  = ({defaultStep})=> ({set, get})=>{
      return {
        state: {value: 0, step:  defaultStep},
        inc: ()=> set((state)=> {state.value+= get().step}),
      }
    }

    it('传入的第二个参数是对象，应该会传入，第一个参数即创建model方法作为参数', function () {

      const {result} = renderHook(()=> useModel(counterModel, {defaultStep: 1}))

      const {getState} = result.current;
      expect(getState().step).toBe(1)
    });

    it('传入的第二个参数是函数，其返回值应该会传入，第一个参数即创建model方法作为参数', function () {

      const {result} = renderHook(()=> useModel(counterModel, ()=> ({defaultStep: 1})))

      const {getState} = result.current;
      expect(getState().step).toBe(1)
    });
  })
})

describe("useModel state", ()=>{
  it('state被重设但是和原来的相等，组件应该不渲染', async () => {
    const counterModel  = ({defaultStep})=> ({set, get})=>{
      return {
        state: {value: 0, step:  defaultStep},
        setDefault: ()=> set((state)=> {
          state.value = 0;
          state.step = defaultStep;
        }),
        inc: ()=> set((state)=>{
          state.value += state.step;
        }),
      }
    };

    const renderCall = jest.fn();
    const {result} = renderHook(()=> {
      const m = useModel(counterModel, ()=> ({defaultStep: 1}));
      useEffect(()=>{
        renderCall(); // 渲染
      })
      return m;
    })

    const {getState, setDefault} = result.current;
    expect(getState().value).toBe(0)
    expect(renderCall.mock.calls).toHaveLength(1);
    // 重设但不渲染。
    await act(()=> setDefault())
    expect(renderCall.mock.calls).toHaveLength(1);

    // 重设但不渲染。
    await act(()=> setDefault())
    expect(renderCall.mock.calls).toHaveLength(1);

  });
})

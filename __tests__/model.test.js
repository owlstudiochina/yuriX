import {delay, tap} from "rxjs/operators";
import {_createState, createModel} from "../model";


describe("_createState", ()=>{

  describe('setState, 不同方式设置state值',  () => {

    it('直接传入state值', function () {
      const state = _createState();
      state.setState({value: 0});
      expect(state.getState()).toEqual({value:0})
    });

    it('cb只有一个state参数', function () {
      const state = _createState();
      state.setState((state)=> {
        state.value = 0
      })
      expect(state.getState()).toEqual({value:0})
    });

    it('cb除一个state参数，还有多个其他参数', function () {
      const state = _createState();
      state.setState((state)=> {
        state.value = 0
      })

      const inc = (state, step)=>{
        state.value+=step
      }
      const step = 1
      state.setState(inc, step) // 多个参数
      expect(state.getState()).toEqual({value:1})
    });
  });

  describe("getState, 获取state值", ()=>{
    it('设置state，获取后相等', function () {
      const state = _createState();
      state.setState({value: 0});
      expect(state.getState()).toEqual({value:0})
    });
  })

  describe("subscribe，订阅state的变化", ()=>{
    it('订阅，能获取变化前后的state', function () {
      const state = _createState();

      const spySub = jest.fn();
      const unsubscribe = state.subscribe(spySub)
      state.setState((state)=> {
        state.value = 0
      })
      //
      const callArgs = spySub.mock.calls[0];
      const [prev, next] = [callArgs[0], callArgs[1]]
      expect(spySub.mock.calls).toHaveLength(1)
      expect(prev).toEqual({})
      expect(next).toEqual({value:0})

      unsubscribe()

    });

    it('取消订阅，则回调不在被调用', function () {
      const state = _createState();

      const spySub = jest.fn();
      const unsubscribe = state.subscribe(spySub)
      state.setState((state)=> {state.value = 0})
      //
      expect(spySub.mock.calls).toHaveLength(1)
      unsubscribe()
      state.setState((state)=> {state.value = 1})
      expect(spySub.mock.calls).toHaveLength(1)
    });
  })
})



describe("createModel", ()=>{

  describe("定义model", ()=>{

    it('返回的创建model的方法，其参数只有({set, get})', function () {
      const counterModel  = ()=> ({set, get})=>{
        return {
          state: {value: 0, step:  1},
          inc: ()=> set((state)=> {state.value+= state.step}),
        }
      };
      const m = createModel(counterModel)
      const {getState} = m;
      expect(getState().step).toBe(1)
    });

    it('返回的创建model的方法，其参数有({set, get}, {pipe, stopAllPipes})', async () => {
      const counterModel  = ()=> ({set, get}, {pipe, stopAllPipes})=>{
        return {
          state: {value: 0, step:  1},

          inc: ()=> pipe(
            delay(100),
            tap(()=> set((state)=> {state.value+= state.step})),
          ),
          stopAllPipes,
        }
      };
      const {getState, inc, stopAllPipes} = createModel(counterModel)
      setTimeout(()=>{stopAllPipes()},5)
      await inc().catch(err=>{})
      expect(getState().step).toBe(1)
    });

    it('创建model的方法，参数只能是({set,get})或({set,get}, effector)', function () {
      // 参数为空，无({set,get})或({set,get}, effector)。
      const counterModel  = ()=> ()=>{
        return {
          state: {value: 0, step:  1},
          inc: ()=> {},
        }
      };
      try {
        createModel(counterModel)
      } catch (e) {
        expect(e).not.toBeUndefined()
      }
    });
  })

  describe("传入model的参数", ()=>{
    const counterModel  = ({defaultStep})=> ({set, get})=>{
      return {
        state: {value: 0, step:  defaultStep},
        inc: ()=> set((state)=> {state.value+= state.step}),
      }
    }

    it('传入的第二个参数是对象，应该会传入，第一个参数即创建model方法作为参数', function () {

      const m = createModel(counterModel, {defaultStep: 1})

      const {getState} = m;
      expect(getState().step).toBe(1)
    });

    it('传入的第二个参数是函数，其返回值应该会传入，第一个参数即创建model方法作为参数', function () {

      const m = createModel(counterModel, ()=> ({defaultStep: 1}))

      const {getState} = m;
      expect(getState().step).toBe(1)
    });
  })


})



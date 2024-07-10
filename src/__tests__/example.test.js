import {act, renderHook} from "@testing-library/react";
import {of} from "rxjs";
import {catchError, concatMap, delay, tap} from "rxjs/operators";
import {useModel} from "../hooks";

const Status = {
  None: "None", // 未初始化
  LoginSucceed: "LoginSucceed", // 登录成功
  Idle: "Idle", // 空闲中
  Acting: "Acting", // 处理中
  Error: "Error",
}

const Errors = {
  nicknameError: new Error("昵称过短"),
  passwordError: new Error("密码过短"),
  invalidLoginError: new Error("昵称或密码有误")
}

const model = ({login})=> ({set, get}, {pipe})=>{

  const states = {
    nickNameInputted: (state, nickname)=>{
      state.nickname = nickname;
      state.status =  Status.Idle;
    },
    passwordInputted: (state, password)=>{
      state.password = password;
      state.status =  Status.Idle;
    },
    idle: (state)=>{
      state.status = Status.Idle;
    },
    submitting: (state)=>{
      state.status = Status.Acting;
    },
    loginSucceed: (state)=>{
      state.status = Status.LoginSucceed;
    },
    errorShowed: (state, msg)=>{
      state.error.msg = msg;
      state.status = Status.Error;
    },
  }


  return {
    state: {
      status: Status.Idle,
      nickname: "",
      password: "",

      error: {msg: ""},
    },

    events: {
      inputNickname: (nickname)=> pipe(
        tap(()=> set(states.nickNameInputted, nickname))
      ),

      inputPassword: (password)=> pipe(
        tap(()=> set(states.passwordInputted, password))
      )
    },

    useCases: {

      submit: ()=>pipe(
        tap(()=>{set(states.submitting)}),
        // 检查昵称和密码正确性，如果有错，报错。
        concatMap(()=>{
          return of(get()).pipe(
            tap(()=>{
              const {nickname} = get();
              if (nickname.length < 6){throw Errors.nicknameError}
            }),
            tap(()=>{
              const {password} = get();
              if (password.length < 6){throw Errors.passwordError}
            }),
            catchError((err)=>{
              return of(get()).pipe(
                tap(()=> set(states.errorShowed, err.message)),
                tap(()=> {throw err}),
              )
            }),
          )
        }),
        // 调用后台api登录，如果昵称或密码有误，展示错误信息。
        concatMap(()=> {
          const {nickname, password} = get();
          return of(get()).pipe(
            concatMap(()=> login(nickname, password)),
            catchError((err)=>{
              return of(get()).pipe(
                tap(()=> set(states.errorShowed, Errors.invalidLoginError.message)),
                tap(()=> {throw Errors.invalidLoginError}),
              )
            }),
          )
        }),
        // 上述都正常，登录成功。
        tap(()=> set(states.loginSucceed)),
        // 上述还有错误，报错。
        catchError((err)=>{
          set(states.idle)
          return Promise.reject(err)
        }),
      ),
    }
  }
}

describe("login", ()=>{
  it('昵称和密码正确，登录成功', async () => {
    const loginService = {
      login: jest.fn().mockImplementation((nickname, password)=>{
        return Promise.resolve({success: 'ok'})
      })
    }
    const {result} = renderHook(()=> useModel(model(loginService)));
    const getState = result.current.getState;
    const {events: {inputNickname, inputPassword}, useCases: {submit}} = result.current;

    await act(()=> inputNickname("hello-world"));
    await act(()=> inputPassword("123456"));
    await act(()=> submit())

    expect(getState().nickname).toBe("hello-world")
    expect(getState().password).toBe("123456")
    expect(getState().status).toBe(Status.LoginSucceed)

  });

  it('昵称或密码错误，登录失败', async ()=> {
    const loginService = {
      login: jest.fn().mockImplementation((nickname, password)=>{
        return Promise.reject({error: {code: "INVALID"}})
      })
    }
    const {result} = renderHook(()=> useModel(model(loginService)));
    const {events: {inputNickname, inputPassword}, useCases: {submit}} = result.current;
    const getState = result.current.getState;

    await act(()=> inputNickname("hello-world"));
    await act(()=> inputPassword("12345678"));

    await expect(act(()=> submit())).rejects.toBe(Errors.invalidLoginError)
    expect(getState().status).toBe(Status.Idle)
  });
})

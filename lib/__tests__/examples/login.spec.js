"use strict";

var _react = require("@testing-library/react");
var _rxjs = require("rxjs");
var _operators = require("rxjs/operators");
var _hooks = require("../../hooks");
const Status = {
  None: "None",
  // 未初始化
  LoginSucceed: "LoginSucceed",
  // 登录成功
  Idle: "Idle",
  // 空闲中
  Acting: "Acting",
  // 处理中
  Error: "Error"
};
const Errors = {
  nicknameError: new Error("昵称过短"),
  passwordError: new Error("密码过短"),
  invalidLoginError: new Error("昵称或密码有误")
};

// 定义登录model
const model = ({
  login
}) => ({
  set,
  get
}, {
  pipe
}) => {
  const states = {
    nickNameInputted: (state, nickname) => {
      state.nickname = nickname;
      state.status = Status.Idle;
    },
    passwordInputted: (state, password) => {
      state.password = password;
      state.status = Status.Idle;
    },
    idle: state => {
      state.status = Status.Idle;
    },
    submitting: state => {
      state.status = Status.Acting;
    },
    loginSucceed: state => {
      state.status = Status.LoginSucceed;
    },
    errorShowed: (state, msg) => {
      state.error.msg = msg;
      state.status = Status.Error;
    }
  };
  return {
    state: {
      status: Status.Idle,
      nickname: "",
      password: "",
      error: {
        msg: ""
      }
    },
    events: {
      inputNickname: nickname => pipe((0, _operators.tap)(() => set(states.nickNameInputted, nickname))),
      inputPassword: password => pipe((0, _operators.tap)(() => set(states.passwordInputted, password)))
    },
    useCases: {
      submit: () => pipe((0, _operators.tap)(() => {
        set(states.submitting);
      }),
      // 检查昵称和密码正确性，如果有错，报错。
      (0, _operators.concatMap)(() => {
        return (0, _rxjs.of)(get()).pipe((0, _operators.tap)(() => {
          const {
            nickname
          } = get();
          if (nickname.length < 6) {
            throw Errors.nicknameError;
          }
        }), (0, _operators.tap)(() => {
          const {
            password
          } = get();
          if (password.length < 6) {
            throw Errors.passwordError;
          }
        }), (0, _operators.catchError)(err => {
          return (0, _rxjs.of)(get()).pipe((0, _operators.tap)(() => set(states.errorShowed, err.message)), (0, _operators.tap)(() => {
            throw err;
          }));
        }));
      }),
      // 调用后台api登录，如果昵称或密码有误，展示错误信息。
      (0, _operators.concatMap)(() => {
        const {
          nickname,
          password
        } = get();
        return (0, _rxjs.of)(get()).pipe((0, _operators.concatMap)(() => login(nickname, password)), (0, _operators.catchError)(err => {
          return (0, _rxjs.of)(get()).pipe((0, _operators.tap)(() => set(states.errorShowed, Errors.invalidLoginError.message)), (0, _operators.tap)(() => {
            throw Errors.invalidLoginError;
          }));
        }));
      }),
      // 上述都正常，登录成功。
      (0, _operators.tap)(() => set(states.loginSucceed)),
      // 上述还有错误，报错。
      (0, _operators.catchError)(err => {
        set(states.idle);
        return Promise.reject(err);
      }))
    }
  };
};
describe("用户登录", () => {
  it('昵称和密码正确，登录成功', async () => {
    // Mock:  登录成功服务
    const loginService = {
      login: jest.fn().mockImplementation((nickname, password) => {
        return Promise.resolve({
          success: 'ok'
        });
      })
    };
    // Given:
    const {
      result
    } = (0, _react.renderHook)(() => (0, _hooks.useModel)(() => model(loginService)));
    const getState = result.current.getState;
    const {
      events: {
        inputNickname,
        inputPassword
      },
      useCases: {
        submit
      }
    } = result.current;

    // When: 当输入正确昵称和密码，并提交
    await (0, _react.act)(() => inputNickname("hello-world"));
    await (0, _react.act)(() => inputPassword("123456"));
    await (0, _react.act)(() => submit());

    // Then: 显示登录成功
    expect(getState().nickname).toBe("hello-world");
    expect(getState().password).toBe("123456");
    expect(getState().status).toBe(Status.LoginSucceed);
  });
  it('昵称或密码错误，登录失败', async () => {
    // Mock:  登录失败服务
    const loginService = {
      login: jest.fn().mockImplementation((nickname, password) => {
        return Promise.reject({
          error: {
            code: "INVALID"
          }
        });
      })
    };
    // Given:
    const {
      result
    } = (0, _react.renderHook)(() => (0, _hooks.useModel)(model(loginService)));
    const {
      events: {
        inputNickname,
        inputPassword
      },
      useCases: {
        submit
      }
    } = result.current;
    const getState = result.current.getState;

    // When: 当输入错误昵称和密码，并提交
    await (0, _react.act)(() => inputNickname("hello-world"));
    await (0, _react.act)(() => inputPassword("12345678"));

    // Then: 显示登录失败
    await expect((0, _react.act)(() => submit())).rejects.toBe(Errors.invalidLoginError);
    expect(getState().status).toBe(Status.Idle);
  });
});
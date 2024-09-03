"use strict";

var _react = require("@testing-library/react");
var _hooks = require("../../hooks");
var _operators = require("rxjs/operators");
describe('定义model，并在传入useModel中使用', () => {
  describe('使用model中的set和get，用于状态管理', () => {
    it('定义一个简单计数器，点击值加1', function () {
      const counter = ({
        set,
        get
      }) => {
        return {
          state: {
            value: 0
          },
          add: () => {
            const {
              value
            } = get();
          }
        };
      };
    });
  });
  describe('定义高阶model，用于传入model中的依赖', () => {
    it('定义计数器model，可传入自定义的步长step是10，点击累加后值为10', async () => {
      // Given: 定义一个高阶model，可传入step的计数器model
      const counter = ({
        step
      }) => ({
        set,
        get
      }) => {
        return {
          state: {
            value: 0
          },
          add: () => {
            set({
              value: get().value + step
            });
          }
        };
      };
      // When: 传入步长为10，点击累加
      const {
        result
      } = (0, _react.renderHook)(() => (0, _hooks.useModel)(() => counter({
        step: 10
      })));
      const {
        add,
        getState
      } = result.current;
      (0, _react.act)(() => add());
      // Then: 值应为10
      expect(getState().value).toBe(10);
    });
  });
  describe('使用model中的pipe和stopAllPipes,用于方便编写业务逻辑', () => {
    it('用户登录输入账户信息提交，用于登录有点慢，点击中止，停止登录成功', async () => {
      // Deps:
      const userService = {
        login: (nickname, password) => new Promise(resolve => {
          setTimeout(() => {
            resolve({
              code: 'OK'
            });
          }, 5000);
        })
      };
      const model = userService => ({
        set,
        get
      }, {
        pipe,
        stopAllPipes,
        isStopError
      }) => {
        return {
          state: {},
          gets: {
            isStopLoginErr: err => isStopError(err)
          },
          useCases: {
            // 登录
            login: (nickname, password) => pipe((0, _operators.concatMap)(() => userService.login(nickname, password))),
            // 停止登录
            stopLogin: () => Promise.resolve(stopAllPipes())
          }
        };
      };

      // Given: 定义了登录的model
      const {
        result
      } = (0, _react.renderHook)(() => (0, _hooks.useModel)(() => model(userService)));
      const {
        useCases: {
          login,
          stopLogin
        },
        gets: {
          isStopLoginErr
        },
        getState
      } = result.current;

      // When：输入账号和密码后，又取消了登录
      const loginStopErrCallback = jest.fn();
      login('hello-world', '123456').catch(err => {
        loginStopErrCallback(err);
      });
      await (0, _react.act)(() => stopLogin());

      // Then: 取消登录成功。（抛出了停止登录的错误）
      expect(isStopLoginErr(loginStopErrCallback.mock.calls[0][0])).toBeTruthy();
    });
  });
  describe('useModel传入返回model的函数，用于动态返回不同的model', () => {
    it('定义1倍和10倍的计数器，组件使用10倍，点击加后，值应为10', async () => {
      // Given: 定义1倍和10倍的2个model
      const counter = ({
        set,
        get
      }) => {
        return {
          state: {
            value: 0,
            step: 1
          },
          add: () => {
            set({
              value: get().value + get().step
            });
          }
        };
      };
      const counterTenTimes = ({
        set,
        get
      }) => {
        return {
          state: {
            value: 0,
            step: 10
          },
          add: () => {
            set({
              value: get().value + get().step
            });
          }
        };
      };
      // When: 传入函数选择10倍的model，并且点击加
      const {
        result
      } = (0, _react.renderHook)(() => (0, _hooks.useModel)(() => counterTenTimes));
      const {
        add,
        getState
      } = result.current;
      await (0, _react.act)(() => add());

      // Then: 值应为10
      expect(getState().value).toBe(10);
    });
  });
  describe('使用model中的sync(sync是rxjs的subject)，用于更新状态同步到组件后再进行执行后续业务', () => {
    it('一个计数器，快速点击20次，状态未立即同步到组件，订阅sync等待同步其完成', async () => {
      const clickTimes = 20;
      // Given: 定义一个计数器，初始值为0. 其通过订阅sync来实现快速点击Promise。
      const counter = ({
        set,
        get,
        sync
      }) => {
        // 订阅sync，等到20次点击同步完成
        const waitSync = () => {
          return new Promise(resolve => {
            const sub = sync.subscribe(({
              value
            }) => {
              if (value === clickTimes) {
                resolve({
                  value
                });
                sub.unsubscribe();
              }
            });
          });
        };
        return {
          state: {
            value: 0
          },
          fastClick: () => {
            for (let i = 0; i < clickTimes; i++) {
              // 实时获取model中的状态值，并设置值加1
              const {
                value
              } = get();
              set({
                value: value + 1
              });
            }
            return waitSync();
          }
        };
      };
      const {
        result
      } = (0, _react.renderHook)(() => (0, _hooks.useModel)(counter));
      const getState = result.current.getState;
      const {
        fastClick
      } = result.current;

      // When: 快速点击并且等待同步完成
      let comValue = 0;
      (0, _react.act)(() => {
        fastClick().then(({
          value
        }) => {
          comValue = value;
        });
      });
      await new Promise(resolve => {
        setTimeout(() => {
          resolve();
        }, 100);
      });

      // Then: 同步完成，组件显示20
      expect(comValue).toBe(clickTimes);
    });
  });
});
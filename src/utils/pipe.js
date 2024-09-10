import {of} from "rxjs";


/**
 * 传入rxjs的操作符operators，执行。
 *  - 如果操作符执行结束，发送的值如果是一个则pipe返回的Promise resolve此值。
 *  - 如果操作符执行结束，发送的值如果是多个则pipe返回的Promise resolve多值的数组。
 *  - 如果中间执行发生错误，则返回的Promise reject错误。
 */
export const pipe = (...operators)=>{
  if (!operators || operators.length === 0 ) {
    return Promise.reject(new Error("operators必须是长度大于1的数租"));
  }
  const ob = of(undefined).pipe(...operators);

  return new Promise((resolve, reject) => {
    const values = [];

    ob.subscribe({
      next: (v)=>{
        values.push(v)
      },
      error: (err)=> {
        reject(err)
      },
      complete: ()=>{
        const res = values.length === 1 ? values[0]: values;
        resolve(res)
      }
    })
  })
}



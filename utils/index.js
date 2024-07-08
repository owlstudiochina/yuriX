import {of, Subject} from "rxjs";
import {takeUntil} from "rxjs/operators";


export const createEffector = ()=>{

  const stopOb = new Subject();
  const stopErr = new Error("pipe被停止了");
  return {
    pipe: (...operators)=>{
      if (!operators || operators.length === 0 ) {
        return Promise.reject(new Error("operators必须是长度大于1的数租"));
      }
      return new Promise((resolve, reject) => {
        const res = [];
        let hasBeStop = false;
        const sub = stopOb.subscribe(()=>{
          hasBeStop = true;
        })

        of(undefined).pipe(
          ...operators,
          takeUntil(stopOb), // 停止所有effect执行
        ).subscribe({
          next: (v)=> {
            res.push(v)
          },
          error: (err)=> {
            sub.unsubscribe();
            reject(err)
          },
          complete: ()=> {
            sub.unsubscribe();

            if(hasBeStop){
              reject(stopErr);
              return;
            }
            //
            if (res.length===0){resolve()}
            else if(res.length===1){resolve(res[0])}
            else {resolve(res)}
          }
        })
      })
    },
    stopAllPipes: ()=>{
      stopOb.next();
    },
    isStopError: (err)=>{
      return err === stopErr
    }
  }
}



//组件直接引用
//  import {add,subtract,multiply,divide} from '../../../../static/floatObj'

  /*
   * 判断obj是否为一个整数
   */
  function isInteger(obj) {
    return Math.floor(obj) === obj
  }

  /*
   * 将一个浮点数转成整数，返回整数和倍数。如 3.14 >> 314，倍数是 100
   * @param floatNum {number} 小数
   * @return {object}
   *   {times:100, num: 314}
   */
  function toInteger(floatNum) {
    var ret = { times: 1, num: 0 };
    if (isInteger(floatNum)) {
      ret.num = floatNum;
      return ret
    }
    var strfi = floatNum + '';
    var dotPos = strfi.indexOf('.');
    var len = strfi.substr(dotPos + 1).length;
    var times = Math.pow(10, len);
    var intNum = parseInt(floatNum * times + 0.5, 10);
    ret.times = times;
    ret.num = intNum;
    return ret
  }

  /*
   * 核心方法，实现加减乘除运算，确保不丢失精度
   * 思路：把小数放大为整数（乘），进行算术运算，再缩小为小数（除）
   *
   * @param a {number} 运算数1
   * @param b {number} 运算数2
   * @param op {string} 运算类型，有加减乘除（add/subtract/multiply/divide）
   *
   */
  function operation(a, b, op) {
    var o1 = toInteger(a);
    var o2 = toInteger(b);
    var n1 = o1.num;
    var n2 = o2.num;
    var t1 = o1.times;
    var t2 = o2.times;
    var max = t1 > t2 ? t1 : t2;
    var result = null;
    switch (op) {
      case 'add':
        if (t1 === t2) { // 两个小数位数相同
          result = n1 + n2
        } else if (t1 > t2) { // o1 小数位 大于 o2
          result = n1 + n2 * (t1 / t2)
        }else if(n1 *t2 < 0){
          result = n2 - n1
        } else { // o1 小数位 小于 o2
          result = n1 * (t2 / t1) + n2
        }
        return result / max;
      case 'subtract':
        if (t1 === t2) {
          result = n1 - n2
        } else if (t1 > t2) {
          result = n1 - n2 * (t1 / t2)
        } else {
          result = n1 * (t2 / t1) - n2
        }
        return result / max;
      case 'multiply':
        result = (n1 * n2) / (t1 * t2);
        return result;
      case 'divide':
        result = (n1 *t2) / (n2 * t1);
        return result
    }
  }

  // ** 加法函数，用来得到精确的加法结果
  // ** 说明：javascript的加法结果会有误差，在两个浮点数相加的时候会比较明显。这个函数返回较为精确的加法结果。
  // ** 调用：accAdd(arg1,arg2)
  // ** 返回值：arg1加上arg2的精确结果
  // **/
 function accAdd(arg1, arg2) {
     var r1, r2, m, c;
     try {
         r1 = arg1.toString().split(".")[1].length;
     }
     catch (e) {
         r1 = 0;
     }
     try {
         r2 = arg2.toString().split(".")[1].length;
     }
     catch (e) {
         r2 = 0;
     }
     c = Math.abs(r1 - r2);
     m = Math.pow(10, Math.max(r1, r2));
     if (c > 0) {
         var cm = Math.pow(10, c);
         if (r1 > r2) {
             arg1 = Number(arg1.toString().replace(".", ""));
             arg2 = Number(arg2.toString().replace(".", "")) * cm;
         } else {
             arg1 = Number(arg1.toString().replace(".", "")) * cm;
             arg2 = Number(arg2.toString().replace(".", ""));
         }
     } else {
         arg1 = Number(arg1.toString().replace(".", ""));
         arg2 = Number(arg2.toString().replace(".", ""));
     }
     return (arg1 + arg2) / m;
 }
 
 /**
  ** 减法函数，用来得到精确的减法结果
  ** 说明：javascript的减法结果会有误差，在两个浮点数相减的时候会比较明显。这个函数返回较为精确的减法结果。
  ** 调用：accSub(arg1,arg2)
  ** 返回值：arg1减去arg2的精确结果
  **/
 function accSub(arg1, arg2) {
     var r1, r2, m, n;
     try {
         r1 = arg1.toString().split(".")[1].length;
     }
     catch (e) {
         r1 = 0;
     }
     try {
         r2 = arg2.toString().split(".")[1].length;
     }
     catch (e) {
         r2 = 0;
     }
     m = Math.pow(10, Math.max(r1, r2)); //last modify by deeka //动态控制精度长度
     n = (r1 >= r2) ? r1 : r2;
     return ((arg1 * m - arg2 * m) / m).toFixed(n);
 }

  // 加减乘除的四个接口
export const add=(a, b)=> {
    return operation(a*1, b*1, 'add')
  }

export const subtract=(a, b)=> {
    return operation(a*1, b*1, 'subtract')
  }

export const multiply=(a, b)=> {
    return operation(a*1, b*1, 'multiply')
  }

export const divide=(a, b)=> {
    return operation(a*1, b*1, 'divide')
  }



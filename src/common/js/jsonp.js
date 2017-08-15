import originJSONP from 'jsonp'

// 跨域获取数据
export default function jsonp (url, data, option) {
  // 先把data里的参数拼接到url上
  url += (url.indexOf('?') < 0 ? '?' : '&') + param(data)

  // 返回一个promise对象
  return new Promise((resolve, reject) => {
    originJSONP(url, option, (err, data) => {
      if (!err) {
        resolve(data)
      } else {
        reject(err)
      }
    })
  })
}

function param (data) {
  let url = ''
  for (let k in data) {
    let value = data[k] !== undefined ? data[k] : ''
    url += `&${k}=${encodeURIComponent(value)}`
  }
  return url ? url.substring(1) : ''
}

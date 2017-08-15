import {commonParams} from './config'
import axios from 'axios'

export function getLyric (mid) {
  const url = 'api/getLyric'

  const data = Object.assign({}, commonParams, {
    songmid: mid,
    pcachetime: +new Date(),
    platform: 'yqq',
    needNewCode: 0,
    hostUin: 0,
    format: 'json'
  })

  return axios.get(url, {
    params: data
  }).then((res) => {
    return Promise.resolve(res.data)
  })
}

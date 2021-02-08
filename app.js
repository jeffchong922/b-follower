const path = require('path')
const express = require('express')
const axios = require('axios')
const compress = require('compression')

const SERVER_PORT = 9527
const SUCCESS_CODE = 'success'
const ERROR_CODE = 'error'
const app = express()
let firstFetchedFollower
let firstFetchedTimestamp

function resolve (filePath) {
  return path.resolve(process.cwd(), filePath)
}

function makeResponseData (code, follower, message, totalCount, firstTime) {
  return {
    code,
    follower,
    message,
    totalCount,
    firstTime
  }
}

const serve = (path, cache) => express.static(resolve(path), {
  maxAge: cache ? 1000 * 60 * 60 * 24 * 30 : 0
})
app.use(compress())
app.use('/', serve('./public'))
app.use('/imgs', serve('./imgs', true))

app.get('/count', (request, response) => {
  const { uid } = request.query
  if (!uid) return response.send(makeResponseData(ERROR_CODE, -1, '请传入uid参数'))
  let responseData
  axios.get(`https://api.bilibili.com/x/relation/stat?vmid=${uid}&bili_only=0&timestamp=${+new Date()}`)
    .then(({ data = {} }) => {
      if (data.code == 0 && data.message == 0) {
        const follower = data.data.follower
        firstFetchedFollower = firstFetchedFollower ? firstFetchedFollower : follower
        firstFetchedTimestamp = firstFetchedTimestamp ? firstFetchedTimestamp : +new Date()
        responseData = makeResponseData(SUCCESS_CODE, follower, data.message, follower - firstFetchedFollower, firstFetchedTimestamp)
      } else {
        responseData = makeResponseData(ERROR_CODE, -1, data.message)
      }
    })
    .catch(({ response: { data: { message } } }) => {
      responseData = makeResponseData(ERROR_CODE, -1, message || e.message)
    })
    .then(() => {
      response.send(responseData)
    })
})

app.listen(SERVER_PORT, () => {
  console.log(`服务器启动端口：${SERVER_PORT}`)
  console.log(`访问地址 http://localhost:${SERVER_PORT} `)
})
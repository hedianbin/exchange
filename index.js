let Koa = require('koa');
//通过koa创建一个应用程序
let app = new Koa();
//导入router/router包，那么变量router拿到的数据就是router/router.js导出的数据
let router = require('./router/router');
//导入静态资源包
let static = require('koa-static');
//导入路径path包
let path = require('path');
//导入模板引擎包
let views = require('koa-views');
//导入koa-body包
let koaBody = require('koa-body');
//导入jsonwebtoken
let jwt = require('jsonwebtoken')
//导入config
let config = require('./config/config')

//将koa-body注册中间件
app.use(koaBody({multipart: true}))
//静态路径注册到中间件
app.use(static(path.join(__dirname, 'static')))
//模板引擎路径和类型配置
app.use(views(path.join(__dirname, 'views'), {
    map: {
        html: 'ejs'
    }
}))

//拦截前端所有访问请求数据
app.use(async (ctx, next) => {
    console.log(`${ctx.method} ${ctx.url} ............`)
    //必须要调next
    await next();
})

//判断用户token是否登录状态。
app.use(async (ctx, next) => {
    //过滤
    if (ctx.path.indexOf('/css/') == 0
        || ctx.path.indexOf('/js/') == 0
        || ctx.path.indexOf('/images/') == 0
        || ctx.path.indexOf('/html/') == 0
        || ctx.path.indexOf('/favicon.ico') == 0) {
        await next()
        return
    }

    // 从body或query或者header中获取token
    let token = ctx.request.body.token
        || ctx.request.query.token
        || ctx.request.headers["x-access-token"]
        || ctx.cookies.get("token");
    console.log(token)
    //判断如果没获取到token
    if (token == "" || token==null || token == undefined) {
        await next()
    }else{
        //验证token
        await jwt.verify(token, config.tokenPassword, async function (err, decode) {
            if (err) {  //  时间失效的时候/ 伪造的token
                console.log(err)
                await next()
            } else {
                console.log(JSON.stringify(decode));
                //获取到加密之前的userid，然后将userid附加到body
                if (ctx.request.method == "POST") {
                    ctx.request.body.userid = decode.userid
                } else {
                    ctx.request.query.userid = decode.userid
                }
                await next();
            }
        })
    }
})




//中间件注册router
app.use(router.routes())
console.log("正在监听3000端口")
//监听3000端口
app.listen(3000)


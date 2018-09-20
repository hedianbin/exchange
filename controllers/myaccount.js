//引入查询所有token和拥有的余额功能模块
let token = require("../models/token")
module.exports={
    myaccountHtml:async (ctx)=>{
        //拿到userid
        let body = ctx.request.query
        let userid = body.userid
        let {error,data} = await token.findAllTokenWitherUserid(userid)
        await ctx.render('myaccount.html',{
            list:data
        })
    }
}
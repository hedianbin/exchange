//引入token
let token = require('../models/token')
//导入config
let config = require('../config/config')
module.exports={
    //返回index.html页面
    indexHtml:async (ctx)=>{
        //查全部token数据
        let {error, data} = await token.findAllToken()
        for (const key in data){
            let element = data[key]//取出查询到的每一条token里面的id.
            let tokeninfo = config.tokeninfo[element.id]
            if (tokeninfo){
                element.price = tokeninfo.price
                element.number = tokeninfo.number
                //总市值
                let totalvalue
                if (element.decimals==0){
                    totalvalue = (element.totalnum * tokeninfo.price)/10000
                }else{
                    totalvalue = ((element.totalnum / element.decimals) * tokeninfo.price)/10000
                }
                element.totalvalue = totalvalue
            }


        }
        await ctx.render('index.html',{
            list:data
        })
    }
}

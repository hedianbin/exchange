//导入sql连接池
let sqlHelpper = require('../utils/sqlHelpper')
//拿到合约地址和ABI数据
let token = require('../models/token')

module.exports={
    //通过userid去查询他的所有的token,并把余额和token名称返回回去
    findAllTokenWitherUserid:async (userid)=>{
        let sql=`select token.id,token.name,token.symbol,usertoken.balance,usertoken.lockbalance
             from token left join usertoken
             on userid=? and token.id=usertoken.tokenid order by usertoken.balance desc`
        let params=[userid]
        //查询数据库
        let data =await sqlHelpper.query(sql,params)
        //将data返回回去
        return data
    },
    //查询智能合约
    findTokenWithId:async (tokenid)=>{
        let sql = "select * from token where id=?"
        let data = await sqlHelpper.query(sql,[tokenid])
        return data
    },
    //获取所有的token
    findAllToken:async ()=>{
        let sql = "select * from token"
        let data = await sqlHelpper.query(sql,[])
        return data
    }


}
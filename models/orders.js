let sqlHelpper = require("../utils/sqlHelpper")
let myUtils= require('../utils/myUtils')
module.exports={
    //查找历史委托
    findOrderWithUserid:async (userid,tokenid,replacetokenid)=>{
        let sql = `select orders.id,orders.createtime,orders.count,transaction.type,transaction.price from orders inner join transaction on orders.transactionid=transaction.id and orders.userid=? and tokenid=? and replacetokenid=?`
        let data = await sqlHelpper.query(sql,[userid,tokenid,replacetokenid])
        return data
    },
    //新增订单
    createOrder:async (userid,transactionid,count)=>{
        let sql=`insert into orders values(0,?,?,?,?)`
        let params=[userid,transactionid,count,myUtils.timestamp()]
        let data = await sqlHelpper.query(sql,params)
        return data
    }
}
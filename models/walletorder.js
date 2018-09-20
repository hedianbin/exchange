//导入sql连接池
let sqlHelpper = require('../utils/sqlHelpper')
//导入myUtils
let myUtils = require('../utils/myUtils')
module.exports={
    //添加提现记录
    createWalletorder:async (userid,tokenid,hash,type,count,toaddress)=>{
        let sql = "insert into walletorder values(0,?,?,?,?,?,?,?)"
        let params = [userid,tokenid,hash,type,count,myUtils.timestamp(),toaddress]
        let data = await sqlHelpper.query(sql,params)
        return data;
    },
    //查询提现/充值记录
    findWalletOrder:async (userid,tokenid,type)=>{
        let sql = "select * from walletorder where userid=? and tokenid=? and type=?"
        let data = await sqlHelpper.query(sql,[userid,tokenid,type])
        //转换提现记录时间戳为时间
        data.data.forEach(element=>{
            element.createtime = myUtils.formatDateTime(element.createtime)
        });
        return data;
    }
}
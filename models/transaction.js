let sqlHelpper = require('../utils/sqlHelpper')
//createtime和updatetime
let myUtils = require('../utils/myUtils')
module.exports={
    //创建挂单数据模型
    transactionModel:{
        id:0,
        userid:0,
        tokenid:0,
        replacetokenid:0,
        price:0,
        totalcount:0,
        count:0,
        status:0,
        type:0,
        createtime:0,
        updatetime:0,
    },
    //新建挂单表
    createTransaction:async (transactionModel)=>{
        let sql = `insert into transaction values(0,?,?,?,?,?,?,?,?,?,?)`
        let params = [transactionModel.userid,transactionModel.tokenid,transactionModel.replacetokenid,transactionModel.price,transactionModel.totalcount,transactionModel.count,transactionModel.status,transactionModel.type,myUtils.timestamp(),myUtils.timestamp()]
        let data = await sqlHelpper.query(sql,params)
        return data
    },
    //查询出所有符合匹配条件的挂单
    matchTransaction:async (transaction)=>{
        let sql = `select * from transaction where status=0 and type!=? and userid!=? and tokenid=? and replacetokenid=? and count>0 and price ${transaction.type==1? "<" : ">"} ? order by price ${transaction.type==1? "asc" : "desc"}`
        let params = [transaction.type,transaction.userid,transaction.tokenid,transaction.replacetokenid,transaction.ask_rate]
        let data = await sqlHelpper.query(sql,params)
        return data
    },
    //查找交易
    findTransaction:async (type,tokenid,replacetokenid)=>{
        let sql="select * from transaction where type=? and status=0 and count>0 and tokenid=? and replacetokenid=? order by price desc"
        let params = [type,tokenid,replacetokenid]
        let data = await sqlHelpper.query(sql,params)
        return data
    },
    //查找当前委托列表数据
    findDelegateTransaction:async (userid,status,tokenid,replacetokenid)=>{
        let sql = 'select * from transaction where userid=? and status = ? and tokenid=? and replacetokenid=?'
        let data = await sqlHelpper.query(sql,[userid,status,tokenid,replacetokenid])
        return data
    },
    //匹配交易之后需要进行的修改
    modifyTransaction:async (id,number,count)=>{
        let sql = `update transaction set count=count-?,status=${count==number? "1":"0"},updatetime=? where id=?`
        let params = [number,myUtils.timestamp(),id]
        let data = await sqlHelpper.query(sql,params)
        return data
    },

}
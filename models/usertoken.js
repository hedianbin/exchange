//导入sql连接池
let sqlHelpper = require('../utils/sqlHelpper')
module.exports = {
    //通过userid去查询他的所有的token,并把余额和token名称返回回去
    findUsertokenWithId: async (userid, tokenid) => {
        //usertoken和token内联接查询
        let sql = `select tokenid,usertoken.balance,usertoken.lockbalance,token.symbol 
        from usertoken inner join token on 
        userid=? and tokenid=? and tokenid=token.id`
        let params = [userid, tokenid]
        //查询数据库
        let data = await sqlHelpper.query(sql, params)
        //将data返回回去
        return data
    },
    //计算转帐后的总代币数
    subBalance: async (userid, tokenid, num) => {
        let sql = "update usertoken set balance=balance-? where userid=? and tokenid=?"
        let data = await sqlHelpper.query(sql, [num, userid, tokenid])
        return data
    },
    //交易后减少token余额
    subBalanceAndLockBalance: async (userid, tokenid, num) => {
        let sql = `update usertoken set balance=balance-?,lockbalance=lockbalance-? where userid=? and tokenid=?`
        let data = await sqlHelpper.query(sql, [num, num, userid, tokenid])
        return data
    },
    //根据userid,tokenid在usertoken表中查询数据
    findUserToken: async (userid, tokenid) => {
        let sql = "select * from usertoken where userid=? and tokenid=?"
        let data = await sqlHelpper.query(sql, [userid, tokenid])
        return data
    },
    //新增usertoken
    createUsertoken: async (userid, tokenid, number, number2) => {
        let sql = "insert into usertoken values(0,?,?,?,0,?)"
        let data = await sqlHelpper.query(sql, [userid, tokenid, number, number2])
        return data
    },
    //修改usertoken
    addBalancetoUsertoken: async (userid, tokenid, number, tokenbalance) => {
        let sql = "update usertoken set balance=balance+?,tokenbalance=tokenbalance+? where userid=? and tokenid=?"
        let data = await sqlHelpper.query(sql, [number, tokenbalance, userid, tokenid])
        return data
    },
    //锁定余额
    addLockBalance: async (userid, tokenid, number) => {
        let sql = 'UPDATE usertoken set lockbalance=lockbalance+? where userid=? and tokenid=?'
        let data = await sqlHelpper.query(sql, [number, userid, tokenid])
        return data
    }
}
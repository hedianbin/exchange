//导入sql连接池
let sqlHelpper = require('../utils/sqlHelpper')
module.exports={
    //这个对象包含了表中所有字段
    walletModel:{
        id:0,
        userid:0,
        address:"",
        privatekey:"",
        keystore:"",
        password:"",
        type:0
    },
    //创建钱包方法，传参是上面的钱包表对象
    createWallet:async (wallet)=>{
        //插入数据库sql语句
        let sql=`insert into wallet values(0,?,?,?,?,?,0)`
        //传的参数
        let params = [wallet.userid,wallet.address,wallet.privatekey,wallet.keystore,wallet.password]
        //执行sql语句插入数据库
        let data = await sqlHelpper.query(sql,params)
        return data
    },
    //查询对应的充值钱包地址
    findWalletWithUseridAndType:async (userid,type)=>{
        let sql="select address from wallet where userid=? and type=?"
        let data = await sqlHelpper.query(sql,[userid,type])
        return data
    }
}

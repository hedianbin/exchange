let sqlHelpper = require('../utils/sqlHelpper')
module.exports={
    createIncome:async (orderid,balance)=>{
        let sql = `insert into income values(0,?,?)`
        let data = await sqlHelpper.query(sql,[orderid,balance])
        return data
    }
}
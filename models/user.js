//导入sql连接池
let sqlHelpper = require('../utils/sqlHelpper')
module.exports = {
    //通过nickname字段查询一个用户
    findUserWithUsername: async (nickname) => {
        let data = await sqlHelpper.query(`select * from user where phone=?`, [nickname])
        return data
    },
    //创建用户
    createUser: async (nickname, password) => {
        //执行插入语句，第一个写0，就自增，第二个？phone,第三个?password，第四个写0就行了
        let data = await sqlHelpper.query(`insert into user values(0,?,?,0)`, [nickname, password])
        return data
    }
}
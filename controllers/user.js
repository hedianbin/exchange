let user = require('../models/user')
let {success, fail} = require('../utils/myUtils')
//导入创建钱包方法
let wallet = require('../models/wallet')
//引入web3
let web3 = require('../utils/myUtils').getweb3()
//导入config
let config = require('../config/config')
//导入utils
let myUtils = require('../utils/myUtils')
//导入jsonwebtoken
let jwt = require('jsonwebtoken')
//导入token
let token = require('../models/token')


module.exports = {
    //返回注册登录页面
    userHtml: async (ctx) => {
        await ctx.render('user.html')
    },
    //注册表单提交方法
    register: async (ctx) => {
        //拿到post表单提交过来的所有数据
        let body = ctx.request.body
        //取出需要的数据,取的是name的值
        let {nickname, password, repassword} = body
        console.log(JSON.stringify(body))
        //1.判断该用户是否存在
        let {error, data} = await user.findUserWithUsername(nickname)
        //如果有错误，或查询出来有数据，说明存在此用户，就不能注册了
        if (error || data.length > 0) {
            if (error) {
                ctx.body = fail("注册失败")
            } else {
                ctx.body = fail("用户已经存在")
            }
            return
        }
        //2.将用户的注册数据存入表中
        data = await user.createUser(nickname, myUtils.md5(password))
        if (data.error) {
            ctx.body = fail("注册失败")
            return
        }

        //3.创建用户所需钱包（主要用于交易所判断，该用户是否充值）
        let walletModel = await createWalletAccount(data.data.insertId)
        await wallet.createWallet(walletModel)

        ctx.body = success("ok")
    },
    login: async (ctx) => {
        //拿到post表单提交过来的所有数据
        let body = ctx.request.body
        //取出需要的数据,取的是name的值
        let {email, password} = body
        console.log(JSON.stringify(body))
        //1.判断该用户是否存在
        let {error, data} = await user.findUserWithUsername(email)
        //如果data查询出来数据了，说明有这个用户,并判断密码是否和数据库中的密码相等
        if (data && data.length > 0 && data[0].password == myUtils.md5(password)) {
            //2.生成token给前端，用于身份验证
            let token = await jwt.sign({
                userid:data[0].id,
                phone: email,
                password: password
                //secret是签名密码，后面expiresIn是过期时间
            }, config.tokenPassword, {expiresIn: '24h'});

            console.log(token)
            //返回给前端token
            ctx.body = success(token)

        } else {
            ctx.body = fail('登录失败')
        }
    }
}

//创建钱包对象
async function createWalletAccount(insertId) {
    //创建钱包帐号,调用这个方法myUtils.salt()生成随机数，就用这个当钱包密码
    let walletPassword = myUtils.salt() //创建钱包密码
    let account = web3.eth.accounts.create(walletPassword);
    //console.log(account)
    //创建keystore
    let keystore = account.encrypt(walletPassword)
    console.log(keystore)
    //将keystore转换成json字符串
    let keystoreString = JSON.stringify(keystore)
    //获取存到表里的数据对象
    let walletModel = {}
    walletModel.userid = insertId
    walletModel.address = account.address
    walletModel.privatekey = account.privateKey
    walletModel.keystore = keystoreString
    walletModel.password = walletPassword
    return walletModel
}
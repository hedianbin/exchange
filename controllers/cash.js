//引入usertoken.js
let usertoken = require('../models/usertoken')
//引入success,fail
let {success, fail} = require('../utils/myUtils')
//引入token.js
let token = require('../models/token')
//引入contract.js
let Contract = require('../models/contract')
//导入config.js
let config = require("../config/config")
//交易记录处理
let walletorder = require('../models/walletorder')
//导入myUtils
let myUtils = require('../utils/myUtils')

function handleSelectObjects(tokenData, param) {
    if (tokenData && tokenData.length > 0) {
        return tokenData[0][param]
    }
    return null
}

function handleSelectObjectsresToken(resToken, param) {
    if (resToken && resToken.data && resToken.data.length > 0) {
        return resToken.data[0][param]
    }
    return null
}

module.exports = {
    cashHtml: async (ctx) => {
        //拿到提现按钮传过来的tokenid
        let tokenid = ctx.request.query.id
        //获取userid
        let userid = ctx.request.query.userid
        //取出token对应数据
        let resToken = await token.findTokenWithId(tokenid)
        //查询某用户拥有的对应token
        let {error, data} = await usertoken.findUsertokenWithId(userid, tokenid)
        console.log(JSON.stringify(data))
        let availbalance
        let symbol =""
        let tokenidData
        if (data && data.length > 0) {
            availbalance = handleSelectObjects(data, "balance") - handleSelectObjects(data, "lockbalance")
            symbol = handleSelectObjects(data, "symbol")
            tokenidData = handleSelectObjects(data, "tokenid")
        } else {
            availbalance = 0
            symbol = handleSelectObjectsresToken(resToken, "symbol")
            tokenidData = handleSelectObjectsresToken(resToken, "id")
        }

        //查询提现记录
        let resData = await walletorder.findWalletOrder(userid, tokenid, 0)

        await ctx.render("withdraw.html", {
            //可用余额
            availbalance:availbalance,
            //简称
            symbol:symbol,
            //tokenid
            tokenid:tokenidData,
            //显示提现记录
            list: resData.data,
        })
    },

    //提现表单被触发的方法
    cash: async (ctx) => {
        let body = ctx.request.body
        console.log(JSON.stringify(body))
        //获取到前端请求中的转帐数据
        let {addr, amount, fundpass, tokenid, userid} = body
        //获取到token表的数据，里面会有合约地址和ABI
        let {error, data} = await token.findTokenWithId(tokenid)
        //判断错误，如果查询有错误，或查询数据长度<=0就说明没查到数据
        if (error || data.length <= 0 || data == null) {
            ctx.body = fail("提现失败，没找到智能合约数据")
            return
        }
        //取第一条数据
        data = data[0]
        console.log(data)
        //拿到智能合约对象
        let contract = await Contract.createContract(data.abi, data.address)

        //转帐,1 合约对象，2 中心帐户，3 转给谁，4 转多少，5 私钥
        let resData = await Contract.sendTokenTransaction(contract, config.centerAddress, addr, parseFloat(amount), config.privatekey)
        console.log(JSON.stringify(resData))
        //判断错误，如果查询有错误
        if (resData.error) {
            ctx.body = fail("提现失败")
            return
        }
        //提现成功
        if (resData.code == 0) {
            //1.减少账户余额
            await usertoken.subBalance(userid, tokenid, amount)
            //2.新增token交易记录
            await walletorder.createWalletorder(userid, tokenid, resData.data.transactionHash, 0, amount, addr)
        }
        ctx.body = resData
    }
}
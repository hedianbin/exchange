//引入token
let token = require('../models/token')
//引入wallet
let wallet = require('../models/wallet')
//交易记录处理
let walletorder = require('../models/walletorder')
//导入usertoken
let usertoken = require('../models/usertoken')
//导入合约模块
let contract = require('../models/contract')
//导入myUtils
let {success, fail} = require('../utils/myUtils')


module.exports = {
    rechargeHtml: async (ctx) => {
        let {userid, id} = ctx.request.query
        console.log(userid + ":" + id)
        //获取token中的name,symbol
        let {data} = await token.findTokenWithId(id)
        //转换数据
        data = data[0]
        //获取钱包地址
        let resData = await wallet.findWalletWithUseridAndType(userid, data.type)

        //查询充值记录
        let walletOrderResData = await walletorder.findWalletOrder(userid, id, 1)

        await ctx.render('deposit.html', {
            name: data.name,
            symbol: data.symbol,
            address: resData.data[0].address,
            //返回充值记录
            list: walletOrderResData.data
        })
    },
    //查询用户有没有充值
    queryUserNewRecharge: async (ctx) => {
        let body = ctx.request.body
        let {userid} = body
        //查全部token数据
        let {error, data} = await token.findAllToken()
        //记录是否有充值的代币
        let haveRecharge = false
        //遍历token
        data.forEach(async token => {
            //1.获取tokenbalance
            let usertokenData = await usertoken.findUserToken(userid, token.id)
            let tokenbalance
            let haveRecode //判断有没有记录
            //判断usertoken表中是否有这条记录
            if (usertokenData.error || usertokenData.data == null || usertokenData.data.length <= 0) {
                //如果没拿到数据
                tokenbalance = 0;
                haveRecode = false;
            } else {
                //拿到tokenbalance
                tokenbalance = usertokenData.data[0].tokenbalance
                haveRecode = true;
            }

            //2.根据userid和type去查询钱包地址
            let walletData = await wallet.findWalletWithUseridAndType(userid, token.type)
            let walletAddress = walletData.data[0].address
            //3.获取token合约相关数据，实例化智能合约对象
            let myContract = await contract.createContract(token.abi, token.address)
            //4.调用balanceOf查询钱包地址余额
            let walletBalance = await myContract.methods.balanceOf(walletAddress).call()
            //最小单位转换为最大单位
            walletBalance = await contract.switchToMaxBalanceUint(myContract, walletBalance)
            //5.比较tokenbalance与钱包地址余额是否相等
            if (walletBalance > tokenbalance) {
                haveRecharge = true
                //说明该token.id代币有人充值
                //充值金额
                let rechargeBalance = walletBalance - tokenbalance
                //6.新增一条充值token交易记录
                await walletorder.createWalletorder(userid, token.id, "", 1, rechargeBalance, "")
                //7.修改或者新增usertoken的一条数据
                //7.1查询有没有这个币在usertoken表里面
                if (haveRecode) {
                    //有记录
                    await usertoken.addBalancetoUsertoken(userid, token.id, rechargeBalance, rechargeBalance)
                } else {
                    //没有记录
                    await usertoken.createUsertoken(userid, token.id, rechargeBalance, rechargeBalance)
                }
            }
        })
        ctx.body = success(haveRecharge)
    }
}
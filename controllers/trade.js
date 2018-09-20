//导入token
let token = require('../models/token')
//导入config
let config = require('../config/config')
//引入usertoken.js
let usertoken = require('../models/usertoken')
//引入success,fail
let {success, fail} = require('../utils/myUtils')
//引入myUtils
let myUtils = require('../utils/myUtils')
//引入transaction.js
let transaction = require('../models/transaction')
//引入orders.js
let orders = require('../models/orders')
//引入income.js
let income = require('../models/income')
//引入sqlHelpper
let sqlHelpper = require('../utils/sqlHelpper')

function handleSelectObjects(tokenData, param) {
    if (tokenData && tokenData.data && tokenData.data.length > 0) {
        return tokenData.data[0][param]
    }
    return null
}

module.exports = {
    tradeHtml: async (ctx) => {
        //对谁进行交易
        let {userid, tokenid, replacetokentype} = ctx.request.query
        console.log(JSON.stringify(ctx.request.query))

        //查询交易的token的数据
        let tokenData = await token.findTokenWithId(tokenid)
        let replacetokenid = config.tokenType[replacetokentype]
        //查询被交易的token的数据
        let replacetokenData = await token.findTokenWithId(replacetokenid)

        //查询交易的token的余额，EOS数据
        let usertokenData = await usertoken.findUserToken(userid, tokenid)
        //查询被交易的token的余额，USDT数据
        let replaceusertokenData = await usertoken.findUserToken(userid, replacetokenid)

        await ctx.render('trade.html', {
            //交易的名字
            name: handleSelectObjects(tokenData, "name"),
            symbol: handleSelectObjects(tokenData, "symbol"),
            //被交易的名字
            replacename: handleSelectObjects(replacetokenData, "name"),
            replacesymbol: handleSelectObjects(replacetokenData, "symbol"),
            //买入的可用余额，USDT
            replaceAvailBalance: handleSelectObjects(replaceusertokenData, "balance") - handleSelectObjects(replaceusertokenData, "lockbalance"),
            //卖出的可用余额，EOS
            availBalance: handleSelectObjects(usertokenData, "balance") - handleSelectObjects(usertokenData, "lockbalance"),
            replacetokentype: replacetokentype,
            tokenid: tokenid,
        })
    },
    //获取挂单列表数据
    transactionList: async (ctx) => {
        let {userid, tokenid, replacetokentype} = ctx.request.query
        //拿到replacetokenid
        let replacetokenid = config.tokenType[replacetokentype]
        //卖的挂单记录
        let sell = await transaction.findTransaction(2, tokenid, replacetokenid)
        //买的挂单记录
        let buy = await transaction.findTransaction(1, tokenid, replacetokenid)
        //查询当前委托列表数据
        let delegate = await transaction.findDelegateTransaction(userid, 0, tokenid, replacetokenid)
        //查询历史委托列表数据
        let myOrder = await orders.findOrderWithUserid(userid, tokenid, replacetokenid)

        //取出token最新价
        let newPrice=0
        if (config.tokeninfo[tokenid] && config.tokeninfo[tokenid].price){
            newPrice=config.tokeninfo[tokenid].price
        }

        //返回给前端查出来的数据
        ctx.body = success({
            sell: sell.data,
            buy: buy.data,
            delegate: delegate.data,
            orders: myOrder.data,
            price:newPrice,
        })
    },

    //挂单
    addOrder: async (ctx) => {
        let body = ctx.request.body
        //ask_rate买入量，ask_vol买入价
        let {ask_rate, ask_vol, tokenid, replacetokentype, type, userid} = body
        console.log(JSON.stringify(body))
        let replacetokenid = config.tokenType[replacetokentype]

        //1.判断token可用余额
        let checkId
        let transactionBalance
        if (type == "1") {//买入
            checkId = replacetokenid
            transactionBalance = ask_rate * ask_vol
        } else {//卖出
            checkId = tokenid
            transactionBalance = ask_vol
        }
        let usertokenData = await usertoken.findUserToken(userid, checkId)
        let balance = handleSelectObjects(usertokenData, "balance")
        if (balance == null) {
            ctx.body = fail("余额不足")
            return
        }
        let lockbalance = handleSelectObjects(usertokenData, "lockbalance")

        //获取可用余额
        let availBalance = balance - lockbalance
        //2.判断可用余额是否能够挂单(可用余额和交易金额进行比较)
        if (availBalance < transactionBalance) {
            ctx.body = fail("余额不足")
            return
        }
        //3.锁定余额
        await usertoken.addLockBalance(userid, checkId, transactionBalance)
        //4.添加到挂单表
        let transactionModel = {//实例化models对象
            id: 0,
            userid: userid,
            tokenid: tokenid,
            replacetokenid: replacetokenid,
            price: ask_rate,
            totalcount: ask_vol,
            count: ask_vol,
            status: 0,
            type: type,
        }
        let {data} = await transaction.createTransaction(transactionModel)
        ctx.body = success("ok")
        //5.匹配交易
        let params = body
        params.id = data.insertId
        params.replacetokenid = replacetokenid
        //用新添加的挂单去匹配之前的所有挂单
        await matchTransaction(params)
    }
}

//匹配挂单的交易
async function matchTransaction(transactionData) {
    let {error, data} = await transaction.matchTransaction(transactionData)
    if (error || data == null || data.length == 0) {
        console.log("未能匹配对应的挂单")
        return
    }
    //设置token最新价
    if (config.tokeninfo[transactionData.tokenid]){
        config.tokeninfo[transactionData.tokenid].price=transactionData.ask_rate
    }else{
        config.tokeninfo[transactionData.tokenid]={
            price:transactionData.ask_rate,
            number:0
        }
    }

    //循环匹配
    let index = 0
    //surplusCount记录新增的挂单还有多少量可以交易
    let surplusCount = transactionData.ask_vol
    while (surplusCount > 0 && index < data.length) {
        //拿到一行要匹配的挂单数据
        let rowData = data[index]
        let transactionCount
        //将查询出来的挂单数据里的可交易量和我要买入或卖出的量进行判断。
        if (rowData.count > transactionData.ask_vol) {
            transactionCount = surplusCount
            surplusCount = 0
        } else {
            transactionCount = rowData.count
            surplusCount -= rowData.count
        }
        //处理被交易方的数据
        await handleTransaction(rowData, transactionCount)

        //新增交易所收入数据
        //计算交易所赚的差价
        let incomeBalance = transactionCount*Math.abs(rowData.price-transactionData.ask_rate)
        await income.createIncome(rowData.id,incomeBalance)
        index++
    }
    //处理交易方的数据
    await handleTransaction(transactionData, transactionData.ask_vol - surplusCount)
    //设置token交易量
    let lastNumber = 0
    if (config.tokeninfo[transactionData.tokenid] && config.tokeninfo[transactionData.tokenid].number){
        lastNumber=config.tokeninfo[transactionData.tokenid].number
    }
    config.tokeninfo[transactionData.tokenid].number = lastNumber+(transactionData.ask_vol-surplusCount)
}

//使用了事务处理
//处理被交易方的数据
async function handleTransaction(rowData, transactionCount) {
    let {id, userid, tokenid, replacetokenid, type, count, price} = rowData
    if (rowData.ask_vol && rowData.ask_rate) {
        count = rowData.ask_vol
        price = rowData.ask_rate
    }

    let sqlParams = []

    //1.更新挂单列表数据
    sqlParams.push({
        sql : `update transaction set count=count-?,status=${count==transactionCount? "1":"0"},updatetime=? where id=?`,
        params : [transactionCount,myUtils.timestamp(),id]
    })
    //2.新增订单
    sqlParams.push({
        sql:`insert into orders values(0,?,?,?,?)`,
        params:[userid,id,transactionCount,myUtils.timestamp()]
    })
    //3.增加买的token数量
    //判断买或卖的token收入数量
    let addTokenid
    let addTokenCount
    if (type==1){//买入
        addTokenid=tokenid
        addTokenCount=transactionCount
    }else{
        addTokenid=replacetokenid
        addTokenCount=transactionCount*price
    }
    //查询要增加的token是否在usertoken表里已经存在
    let usertokenData = await usertoken.findUserToken(userid,addTokenid)
    if (usertokenData.error || usertokenData.data==null|| usertokenData.length==0){
        //新增token的数量到usertoken表
        sqlParams.push({
            sql : "insert into usertoken values(0,?,?,?,0,0)",
            data : await sqlHelpper.query(sql, [userid, addTokenid, addTokenCount])
        })
    }else{
        //增加usertoken表里的balance
        sqlParams.push({
            sql : "update usertoken set balance=balance+? where userid=? and tokenid=?",
            params : [addTokenCount, userid, addTokenid]
        })
    }
    //4.减少卖的token数量
    let subTokenid
    let subTokenCount
    if (type==1){
        subTokenid=replacetokenid
        subTokenCount=transactionCount*price
    }else{
        subTokenid=tokenid
        subTokenCount=transactionCount
    }
    sqlParams.push({
        sql : `update usertoken set balance=balance-?,lockbalance=lockbalance-? where userid=? and tokenid=?`,
        params : [subTokenCount, subTokenCount, userid, subTokenid]
    })
    //执行事务
    await sqlHelpper.executionTransactions(sqlParams)
}

//未使用事务处理
//处理被交易方的数据
async function handleTransaction2(rowData, transactionCount) {
    let {id, userid, tokenid, replacetokenid, type, count, price} = rowData
    if (rowData.ask_vol && rowData.ask_rate) {
        count = rowData.ask_vol
        price = rowData.ask_rate
    }
    //1.更新挂单列表数据
    await transaction.modifyTransaction(id, transactionCount, count)
    //2.新增订单
    await orders.createOrder(userid, id, transactionCount)
    //3.增加买的token数量
    //判断买或卖的token收入数量
    let addTokenid
    let addTokenCount
    if (type==1){//买入
        addTokenid=tokenid
        addTokenCount=transactionCount
    }else{
        addTokenid=replacetokenid
        addTokenCount=transactionCount*price
    }
    //查询要增加的token是否在usertoken表里已经存在
    let usertokenData = await usertoken.findUserToken(userid,addTokenid)
    if (usertokenData.error || usertokenData.data==null|| usertokenData.length==0){
        //新增token的数量到usertoken表
        await usertoken.createUsertoken(userid,addTokenid,addTokenCount,0)
    }else{
        //增加usertoken表里的balance
        await usertoken.addBalancetoUsertoken(userid,addTokenid,addTokenCount,0)
    }
    //4.减少卖的token数量
    let subTokenid
    let subTokenCount
    if (type==1){
        subTokenid=replacetokenid
        subTokenCount=transactionCount*price
    }else{
        subTokenid=tokenid
        subTokenCount=transactionCount
    }
    await usertoken.subBalanceAndLockBalance(userid,subTokenid,subTokenCount)
}
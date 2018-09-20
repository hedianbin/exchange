//引入web3
let web3 = require('../utils/myUtils').getweb3()
//引入success, fail
let {success, fail} = require("../utils/myUtils")
module.exports = {
    //最小单位转换最大单位
    switchToMaxBalanceUint:async (myContract,balance)=>{
       let decimal = await myContract.methods.decimals().call()
        return balance / (Math.pow(10,decimal))
    },

    //创建智能合约对象
    createContract: async (abi, address) => {
        return new web3.eth.Contract(JSON.parse(abi),address)
    },
    //转帐交易
    sendTokenTransaction: async (myContract,fromaddress, toaddress, number, privatekey) => {
        var Tx = require('ethereumjs-tx');
        //然后还要设置转帐人私钥，把转帐人的私钥传进来
        var privateKey = new Buffer(privatekey.slice(2), 'hex')
        //获取nonce值
        let nonce = await web3.eth.getTransactionCount(fromaddress)
        //获取gasPrice的值
        let gasPrice = await web3.eth.getGasPrice()
        //获取代币的次方数
        let decimals = await myContract.methods.decimals().call()
        //计算出代币转帐数额，需要取来的number乘以10的decimals次方。次方计算用math.pow方法
        let balance = number * Math.pow(10, decimals)
        //查询钱包帐户里合约的余额
        let myBalance = await myContract.methods.balanceOf(fromaddress).call()
        //判断合约余额不够转帐,就返回错误。
        if (myBalance<balance){
            ctx.body = fail("余额不足")
            return
        }
        //如果余额够转帐，就执行转帐
        let tokenData = await myContract.methods.transfer(toaddress,balance).encodeABI()
        var rawTx = {
            //nonce:可以通过web3提供方法获取。相应的api,web3.eth.getTransactionCount,获取交易个数，这个交易个数就是nonce,以太坊和比特币nonce一样，以太坊的nonce值是增加一笔交易才+1，而比特币是为了pow的有效算有效hash的时候nonce无限+1.
            nonce: nonce,
            //gasPrice:交易价格，也可以通过web3的方法获取web3.eth.getGasPrice
            gasPrice: gasPrice,
            //to: 这个应该是合约的地址,只有转以太币才是收款人地址
            to: myContract.options.address,
            from:fromaddress,
            //value:转帐数额，需要前端传过来
            // value: myBalance,
            //data:转token的时候需要设置，如果转以太币就不需要，传空就行了。
            data: tokenData
        }

        //预估本次交易所要花费的gas
        let gas = await web3.eth.estimateGas(rawTx)
        //将预估好的gas值设置到rawTx中
        rawTx.gas = gas
        //创建交易对象
        var tx = new Tx(rawTx);
        //签名
        tx.sign(privateKey);
        //将交易进行序列化
        var serializedTx = tx.serialize();

        //存储返回给前端的数据
        let responseData;
        //将交易转成16进制字符串后发送交易。是异步的，需要加await
        await web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex'), function (err, data) {
            console.log(err)
            console.log(data)
            if (err) {//判断，如果err不为空，就说明交易发送失败
                responseData = fail(err)//把错误信息返回给前端
            }
        })
            .then(function (data) {
                console.log(data)
                if (data) {//如果data有值，说明有交易数据生成
                    //返回给前端2个字段
                    responseData = success({
                        "blockHash": data.blockHash,//区块hash
                        "transactionHash": data.transactionHash//交易hash
                    })
                } else {
                    responseData = fail("交易失败，没拿到交易数据")
                }
            })

        return responseData;
    }
}
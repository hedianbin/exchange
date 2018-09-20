//引入web3
let web3 = require('../utils/myUtils').getweb3()
//导入fs包
let fs = require("fs")
//导入path包
let path = require("path")
//导入sql连接池
let sqlHelpper = require('./sqlHelpper')

//拿到合约的路径
let contractPath = path.join(__dirname, "../build/", "MyToken.json")

//同步读取合约文件
let data = fs.readFileSync(contractPath, "utf8")
//data转化成JSON对象
let jsonObject = JSON.parse(data)
//通过编译后的interface获取到合约实例
var myContract = new web3.eth.Contract(JSON.parse(jsonObject.interface))
console.log(myContract)
//部署合约

//第一种方式
//它需要传的参数是map类型
myContract.deploy({
    /*
    第一个字段传的就是合约里的bytecode

    第二个参数传的合约构造函数里面传的那四个值。
    "MeToCoin"
    "MTB"
    18
    1000000000000000000000000000
    */
    data: "0x" + jsonObject.bytecode,
    arguments: ["狗狗币", "DOGE", 4, 50000000000]
})
    .send({
        //用哪个帐号去部署合约
        from: '0x635ab4064433110e64b9fa92106e7dd63f27a57c',
        //花费的gas
        gas: 1500000,
        gasPrice: '30000000000000'
        //回调方法，合约生成后transactionHash里存的是交易的hash
    }, function (error, transactionHash) {
        console.log(transactionHash)
    })
    //.on是异步触发的函数
    //如果出现error错误,就会触发后面的回调方法，没错误，方法就不会被触发
    .on('error', function (error) {
        console.log(error)
    })

    .then(async function (newContractInstance) {
        console.log(newContractInstance.options.address)
        //用异步方式调用
        newContractInstance.methods.name().call()
            .then(function (r) {
                console.log(r)
            })
        //用同步方式调用api,需要在实例对象前面添加await,同时在function前面添加async
        let name = await newContractInstance.methods.name().call()
        let symbol = await newContractInstance.methods.symbol().call()
        let decimals = await newContractInstance.methods.decimals().call()
        let totalSupply = await newContractInstance.methods.totalSupply().call()
        // //拿到name
        // console.log("name:"+name)
        // //拿到symbol
        // console.log("symbol:"+symbol)
        // //拿到decimals
        // console.log("decimals:"+decimals)
        // //拿到totalSupply
        // console.log("totalSupply:"+totalSupply)

        //将发的币存到token表中
        let sql = "insert into token values(0,?,?,?,?,?,?,0)"
        let params = [
            newContractInstance.options.address,
            jsonObject.interface,
            name,
            symbol,
            decimals,
            totalSupply
        ]
        console.log(params)
        let data = await sqlHelpper.query(sql, params)
        console.log(data)
    });
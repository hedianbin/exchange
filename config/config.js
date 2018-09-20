module.exports={
    tokenPassword:"mima123",
    //中心帐户地址
    centerAddress:"0x635Ab4064433110e64B9fa92106E7Dd63F27A57C",
    //中心帐户私钥
    privatekey:"0x67bf791a2230ee5fa574146d8090a687c6d88c4179bef69ce509a04ecafbb157",
    //replacetokentype对应token表中哪个币的tokenid
    tokenType:{
        1:5,//USDT
        2:4,//ETH
        3:8,//EOS
        4:12,//BTC
    },
    mysql:{
        // connectionLimit : 10,//连接限制，最多连10个
        host            : '192.168.159.15',
        user            : 'root',
        password        : '123456',
        database        : 'exchange'
    },
    web3Url:'http://192.168.159.15:8545',
    web3kovan:'https://kovan.infura.io/v3/428486a36f2c4994b65a86f5b604611c',
    tokeninfo:{}
}
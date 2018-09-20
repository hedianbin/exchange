//引入crypto库
let crypto = require('crypto')
//引入config
let config = require('../config/config')
module.exports = {
    //产生时间戳
    timestamp: () => {
        return Date.now()
    },
    //时间戳转时间
    formatDateTime: (inputTime) => {
        var date = new Date(inputTime);
        var y = date.getFullYear();
        var m = date.getMonth() + 1;
        m = m < 10 ? ('0' + m) : m;
        var d = date.getDate();
        d = d < 10 ? ('0' + d) : d;
        var h = date.getHours();
        h = h < 10 ? ('0' + h) : h;
        var minute = date.getMinutes();
        var second = date.getSeconds();
        minute = minute < 10 ? ('0' + minute) : minute;
        second = second < 10 ? ('0' + second) : second;
        return y + '-' + m + '-' + d + ' ' + h + ':' + minute + ':' + second;
    },

//md5加密明文
    md5: (text) => {
        return crypto.createHash("md5").update(String(text)).digest("hex");
    },
    // 生成 随机字符串
    salt:
        () => {
            var time = Date.now() % 100,
                str = '';
            time = time === 0 ? '00' : String(time);

            for (var i = 0; i < 8; i++) {
                // 65 A 97 a base > 65  base < 97
                const base = Math.random() < 0.5 ? 65 : 97;
                str += String.fromCharCode(
                    base + Math.floor(Math.random() * 26)
                );
            }
            return time + str;
        },
    getweb3:
        () => {
            //导入web3库
            let Web3 = require("web3")
            //连接私链
            var web3 = new Web3(Web3.givenProvider || config.web3Url);
            // var web3 = new Web3(Web3.givenProvider || 'https://kovan.infura.io/v3/428486a36f2c4994b65a86f5b604611c');
            //返回web3对象
            return web3
        },
    success:
        (data) => {
            responseData = {
                code: 0,
                status: "success",
                data: data
            }
            return responseData
        },

    fail:
        (msg) => {
            responseData = {
                code: 1,
                status: "fail",
                msg: msg
            }
            return responseData
        }
}
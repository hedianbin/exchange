$(document).ready(function () {

    //时间戳转时间
    function formatDateTime(inputTime) {
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
    }

    $("#historydelegteOrder").mouseover(function () {
        $("#currOrder").hide()
        $("#historyOrder").show()
    })
    $("#currdelegateOrder").mouseover(function () {
        $("#currOrder").show()
        $("#historyOrder").hide()
    })

    let tokenid = $("input[name=tokenid]").val()
    let replacetokentype = $("input[name=replacetokentype]").val()
    console.log("tokenid:", tokenid)
    console.log("replacetokentype:", replacetokentype)

    $.get("/transactionList", `tokenid=${tokenid}&replacetokentype=${replacetokentype}`, function (data, status) {
        console.log(status + JSON.stringify(data))
        if (data.code == 0) {
            //设置最新价
            $("#orderbook_last_rate").text(data.data.price)

            //挂单中卖的列表
            let sellUl = $("#ul-ask-list")
            let index = 0
            let sellLength = data.data.sell.length
            //遍历sell每一条记录
            data.data.sell.forEach(element => {
                //要向ul中添加的元素
                let liStr = `<li >
                    <span style="margin-right: 14px; color: #008069; font-weight: normal; display: inline-block; width: 40px">卖${sellLength - index}</span>
                    <span style="margin-right: 77px; color: #008069; font-weight: normal; display: inline-block; width: 40px"">${element.price}</span>
                    <span style="margin-right: 46px;  font-weight: normal; display: inline-block; width: 40px"">${element.count}</span>
                    <span style="font-weight: normal; display: inline-block; width: 40px"">${element.totalcount}</span>
                </li>`
                sellUl.append(liStr)
                index++
            });

            //挂单中买的列表
            let buyUl = $("#ul-bid-list")
            index = 0
            //遍历sell每一条记录
            data.data.buy.forEach(element => {
                //要向ul中添加的元素
                let liStr = `<li >
                    <span style="margin-right: 14px; color: #de5959; font-weight: normal; display: inline-block; width: 40px">买${index + 1}</span>
                    <span style="margin-right: 77px; color: #de5959; font-weight: normal; display: inline-block; width: 40px"">${element.price}</span>
                    <span style="margin-right: 46px;  font-weight: normal; display: inline-block; width: 40px"">${element.count}</span>
                    <span style="font-weight: normal; display: inline-block; width: 40px"">${element.totalcount}</span>
                </li>`
                buyUl.append(liStr)
                index++
            })

            //当前委托列表
            let currdelegateOrder = $("#current-entrust-list")
            index=0
            //遍历sell每一条记录
            data.data.delegate.forEach(element => {
                //要向ul中添加的元素
                let liStr = `<li> 
                    <span style="margin-left: 10px">${formatDateTime(element.updatetime)}</span> 
                    <span style="margin-left: 50px">${element.type == 1 ? "买" : "卖"}</span> 
                    <span style="margin-left: 130px"> <em id="odPriceCol">${element.price} </em> </span> 
                    <span style="margin-left: 130px">${element.count}</span> 
                    <span style="margin-left: 110px">挂单中</span> </li>`
                currdelegateOrder.append(liStr)
                index++
            })

            //历史委托列表
            let historydelegateOrder = $("#history-entrust-list")
            index=0
            //遍历sell每一条记录
            data.data.orders.forEach(element => {
                //要向ul中添加的元素
                let liStr = `<li> 
                    <span style="margin-left: 10px">${formatDateTime(element.createtime)}</span> 
                    <span style="margin-left: 50px">${element.type == 1 ? "买" : "卖"}</span> 
                    <span style="margin-left: 130px"> <em id="odPriceCol">${element.price} </em> </span> 
                    <span style="margin-left: 130px">${element.count}</span>
                    <span style="margin-left: 110px">已成交</span> </li>`
                historydelegateOrder.append(liStr)
                index++
            })
        }
    })
    //买入token
    $(".transaction-buy-form").validate({
        submitHandler: function (form) {
            formRequest(form)
        }
    })
    //卖出token
    $(".transaction-sell-form").validate({
        submitHandler: function (form) {
            formRequest(form)
        }
    })

    function formRequest(form) {
        var urlStr = "/addorder"
        alert("urlStr:" + urlStr)
        $(form).ajaxSubmit({
            url: urlStr,
            type: "post",
            dataType: "json",
            //如果post成功等待后端传过来的信息
            success: function (data, status) {
                console.log(status + JSON.stringify(data))
                if (data.code == 0) {//如果==0就跳转到登录页面
                    alert("挂单成功")
                } else {
                    alert(data.msg)
                }
            },
            error: function (data, status) {
                console.log(status + JSON.stringify(data))
            }
        });
    }

})
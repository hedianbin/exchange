//验证注册表单
$(document).ready(function () {
    //注册
    $("#signupForm").validate({
        //验证规则取的是name的值
        rules: {
            nickname: {
                required: true,
                rangelength: [11, 11],
            },
            password: {
                required: true,
                rangelength: [5, 10]
            },
            repassword: {
                required: true,
                rangelength: [5, 10],
                equalTo: "#sig_password" //这个是判断两次输入密码是否相等，取的是id
            }
        },
        messages: {
            nickname: {
                required: "请输入用户名",
                rangelength: "用户名必须是11位",
            },
            password: {
                required: "请输入密码",
                rangelength: "密码必须是5-10位",
            },
            repassword: {
                required: "请确认密码",
                rangelength: "密码必须是5-10位",
                equalTo: "两次输入的密码必须相等"
            },
        },
        //指定错误显示位置
        errorPlacement: function (error, element) { //错误信息位置设置方法
            if (element.attr("id") == "sig_userName") {
                error.appendTo("#username_text")
            }
            if (element.attr("id") == "sig_password") {
                error.appendTo("#password_text")
            }
            if (element.attr("id") == "sig_repassword") {
                error.appendTo("#repassword_text")
            }
        },
        submitHandler: function (form) {
            var urlStr = "/sendsignup"
            alert("urlStr:" + urlStr)
            $(form).ajaxSubmit({
                url: urlStr,
                type: "post",
                dataType: "json",
                //如果post成功等待后端传过来的信息
                success: function (data, status) {
                    console.log(status + JSON.stringify(data))
                    if (data.code == 0) {//如果==0就跳转到登录页面
                        alert(data.data)
                        setTimeout(function () {
                            window.location.href = "/login"
                        }, 1000)
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

    //验证登录表单
    $("#loginForm").validate({
        rules: {
            email: {
                required: true,
                rangelength: [11, 11],
            },
            password: {
                required: true,
                rangelength: [5, 10]
            },
        },
        messages: {
            email: {
                required: "请输入用户名",
                rangelength: "用户名必须是11位",
            },
            password: {
                required: "请输入密码",
                rangelength: "密码必须是5-10位",
            },
        },
        //指定错误显示位置
        errorPlacement: function (error, element) { //错误信息位置设置方法
            if (element.attr("id") == "email") {
                error.appendTo("#email_text")
            }
            if (element.attr("id") == "password") {
                error.appendTo("#loginpassword_text")
            }
        },
        submitHandler: function (form) {
            var urlStr = "/sendlogin"
            $(form).ajaxSubmit({
                url: urlStr,
                type: "post",
                dataType: "json",
                //如果post成功等待后端传过来的信息
                success: function (data, status) {
                    console.log(status + JSON.stringify(data))
                    if (data.code == 0) {//如果==0就跳转到登录页面
                        //设置cookie
                        document.cookie = "token="+data.data
                        alert(data.data)
                        setTimeout(function () {
                            window.location.href = "/myaccount"
                        }, 1000)
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
})
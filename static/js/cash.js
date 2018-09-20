//提现表单提交
$(document).ready(function () {
    //验证提现表单
    $("#withdraw_form").validate({
        submitHandler: function (form) {
            var urlStr = "/cash"
            $(form).ajaxSubmit({
                url: urlStr,
                type: "post",
                dataType: "json",
                //如果post成功等待后端传过来的信息
                success: function (data, status) {
                    console.log(status + JSON.stringify(data))
                    if (data.code == 0) {//如果==0就跳转到登录页面
                        alert("提现成功")
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
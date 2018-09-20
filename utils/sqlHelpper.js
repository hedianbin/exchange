var mysql = require('mysql');
var config = require('../config/config')
//异步流程控制模块，async模块是为了解决嵌套金字塔,和异步流程控制而生.
var async = require('async')

//将连接放入池子中
var pool = mysql.createPool(config.mysql);

//可以让外面可以增删改查。
module.exports = {
    //通过query这个方法获取连接池
    query: async (sql, params) => {
        //通过创建promise去实现同步，调用resolve是触发成功的回调方法，调用reject是触发失败的回调方法
        let promise = new Promise((resolve, reject) => {
            //连接mysql
            pool.getConnection(function (err, connection) {
                if (err) {
                    //如果连接错误，就执行reject
                    reject(err)
                } else {
                    // 用获取到的连接池做数据库操作，回调函数中的三个参数分别是错误，查询结果，字段
                    connection.query(sql, params, function (error, results, fields) {
                        console.log(`\n${sql}\n${params}`)
                        // 在发布后处理错误
                        if (error) {
                            reject(error)
                        } else {//查询成功返回查询的结果
                            resolve(results)
                        }
                        //把查询结果打印出来
                        console.log(results)

                        // 释放连接
                        connection.release();

                    });
                }
            });
        })

        let result;
        //用同步，调用promise.then，等待promise执行完成后触发下面方法
        //function (data)触发条件是，在new Promise((resolve, reject)成功了调用resolve("1")的时候触发
        await promise.then(function (data) {
            result = {error: null, data: data}
            //或者触发下面方法，调用reject的时候触发
        }, function (error) {
            result = {error: error, data: null}
        })
        //将result返回外部去
        console.log(JSON.stringify(result))
        return result
    },
    //执行事务
    executionTransactions: async (sqlParams) => {
        //通过创建promise去实现同步，调用resolve是触发成功的回调方法，调用reject是触发失败的回调方法
        let promise = new Promise((resolve, reject) => {
            //执行sql事务方法，如果失败执行reject，成功执行resolve
            poolExecutionTransaction(sqlParams, function (err, data) {
                if (err) {
                    console.log('err:' + err)
                    reject(err)
                } else {
                    resolve(data)
                }
            })
        })
        //用同步，调用promise.then，等待promise执行完成后触发下面方法
        //function (data)触发条件是，在new Promise((resolve, reject)成功了调用resolve("1")的时候触发,否则触发reject方法
        let result;
        await promise.then(function (data) {
            result = {"error": null, "data": data}
        }), function (error) {
            result = {"error": error, "data": null}
        }
        console.log(JSON.stringify(result))
        return result
    }
}

//执行sql事务池方法
function poolExecutionTransaction(sqlparams, callback) {
    //连接mysql,获取连接
    pool.getConnection(function (err, connection) {
        if (err) {//如果有连接有错误，直接终止执行，返回错误
            console.log(err)
            return callback(err, null)
        }
        //开始一个事务
        connection.beginTransaction(function (err) {
            //开始事务失败，返回错误
            if (err) {
                console.log(err)
                return callback(err, null);
            }
            //事务开始成功
            console.log("开始执行transaction,共执行" + sqlparams.length + "条数据");
            var funcAry = [];//用来收集执行的事务返回信息
            //遍历要执行的每一个事务SQL语句
            sqlparams.forEach(function (sql_param) {
                var temp = function (cb) {
                    var sql = sql_param.sql;//取出sql
                    var param = sql_param.params;//取出params
                    //执行query
                    connection.query(sql, param, function (tErr, rows, fields) {
                        //sql查询失败
                        if (tErr) {
                            //回滚一个事务
                            connection.rollback(function () {
                                console.log("事务失败， " + sql_param + ", ERROR: " + tErr)
                                throw tErr;
                            });
                        } else {
                            //成功执行sql查询，返回ok
                            return cb(null, 'ok');
                        }
                    })
                }
                //记录本次执行结果
                funcAry.push(temp);
            })
            //异步流程控制，多个函数从上到下依次执行,相互之间没有数据交互
            //如果中途发生错误,则将错误传递到回调函数,并停止执行后面的函数
            async.series(funcAry, function (err, result) {//将上面事务返回的信息做流程处理
                if (err) {
                    console.log("async.series error:" + err)
                    //回滚一个事务
                    connection.rollback(function (err) {
                        console.log("connection.rollback error: " + err);
                        connection.release();//释放连接
                        return callback(err, null);//将错误传递给回调函数
                    });
                } else {
                    //提交事务
                    //该方法用于使当前事务中的更改成为持久的更改，并释放Connection对象当前持有的所有数据库锁。
                    // 此方法只有在手动事务的模式下才可以用。
                    connection.commit(function (err, info) {
                        if (err) {
                            console.log("执行事务失败， " + err)
                            //回滚一个事务
                            connection.rollback(function (err) {
                                console.log("connection.rollback error: " + err)
                                connection.release();//释放连接
                                return callback(err, null);//将错误传递给回调函数
                            })
                        } else {
                            connection.release();//释放连接
                            return callback(null, info);//返回给回调函数
                        }
                    })
                }
            })
        })
    })
}
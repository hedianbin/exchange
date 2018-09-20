let router = require("koa-router")()
let indexController = require('../controllers/index')
let userController = require('../controllers/user')
let myaccountController = require('../controllers/myaccount')
let cashController = require('../controllers/cash')
let rechargeController = require('../controllers/recharge')
let tradeController = require('../controllers/trade')

//网页请求
router.get('/',indexController.indexHtml)
router.get('/login',userController.userHtml)
router.get('/signup',userController.userHtml)
router.get('/myaccount',myaccountController.myaccountHtml)
router.get('/cash',cashController.cashHtml)
router.get('/recharge',rechargeController.rechargeHtml)
router.get('/trade',tradeController.tradeHtml)
router.get('/transactionList',tradeController.transactionList)

//post请求
router.post('/sendsignup',userController.register)
router.post('/sendlogin',userController.login)
router.post('/cash',cashController.cash)
router.post('/querynewrecharge',rechargeController.queryUserNewRecharge)
router.post('/addorder',tradeController.addOrder)

module.exports = router
/*
 * 本代码采用的MongoDB数据库，需要事先安装配置好
 * 连接数据库采用的是mongoose模块
 * npm install mongoose --save
 * */
// 引入网络模块
var net = require('net');
//报文对象构造函数
var Msgfunc = function(str){
	var index = str.indexOf(' ');
	if(index === -1){
		this.status = str.slice(0,-1).toString();
		this.content = '\n';
	}
	else{
		this.status = str.slice(0,index).toString();
		this.content = str.slice(index+1, -1).toString();
	}
}
// 创建TCP服务器
var server = new net.Server();
//引入mongoose
var mongoose = require('mongoose');
//数据库连接的URL
var dbUrl = 'mongodb://localhost:27017/ATM'
//用户对象构造函数
var ATMUser = function(num,pwd,blc){
	this.cardNum = num;
	this.passWord = pwd;
	this.balance = blc;
}

//连接到数据库
mongoose.connect(dbUrl,{useNewUrlParser:true},function(err){
	if(err){
		console.log('DataBase connect failed');
	}
	else{
		console.log('DataBase connect success');
	}
})

//创建数据库的Schema
var mySchema = new mongoose.Schema({
	cardNum:String,
	passWord:String,
	balance:Number
})

//创建Model
var myModel = mongoose.model('user',mySchema);
//

server.on('connection',function(socket){
	//socket错误监听
	socket.on('error',function(error){
		console.log(error)
	})
	//记录请求者的卡号
	var userCard = new String();
	//确保验证密码后相关的权限
	var keyLock = false;
	//收到数据时触发
	socket.on('data',function(data){
		var reqStr;
		//请求报文字符串转换的对象
		var reqObj = {};

		reqObj = new Msgfunc(data);
		console.log('用户发来的数据是： '+data)
		//用户插卡了
		if(reqObj.status === 'HELO'){
			// 检索用户是否存在
			myModel.findOne({cardNum:reqObj.content},function(err,doc){
				if(err){
					console.log(err)
					return;
				}
				//用户不存在
				if(doc === null){
					reqStr = 'ERR 404\n';
					socket.write(reqStr);
					console.log('msg had sent '+reqStr);
				}
				else{
					userCard = reqObj.content;
					reqStr = 'PASSWD\n'
					socket.write(reqStr);
					console.log('发送PASSWD '+reqStr);
				}
			})
		}
		//用户输入密码了
		else if(reqObj.status === 'PASSWD'){
			// 匹配用户名与密码
			myModel.findOne({cardNum:userCard},function(err,doc){	
				if(err){
					console.log('err'+err);
					return;
				}
				//如果密码错误
				if(doc.passWord != reqObj.content){
					console.log('接收到的密码'+reqObj.content+'数据库的密码：'+doc.passWord)
					reqStr = 'ERR 403\n'
					socket.write(reqStr)
				}
				else{
					reqStr = 'OK\n'
					console.log('返回OK')
					keyLock = true;
					socket.write(reqStr)
				}
			})
		}
		// 用户请求查询余额了
		else if(reqObj.status === 'BALANCE'){
			//如果没输入密码就想看别人钱
			if(!keyLock){
				reqStr = 'ERR 401\n'
				socket.write(reqStr);
				return;
			}
			// 发送余额数
			myModel.findOne({cardNum:userCard},function(err,doc){
				if(err){
					console.log(err);
					return;
				}
				reqStr = 'AMOUNT '+doc.balance+'\n';
				socket.write(reqStr);
			})
		}
		// 用户取钱
		else if(reqObj.status === 'WITHDRAWL'){
			//如果没输入密码就想取钱
			if(!keyLock){
				reqStr = 'ERR 401\n'
				socket.write(reqStr);
				return;
			}
			// 判断请求的钱减去余额是否大于零,如果是则,如果否则....
			myModel.findOne({cardNum:userCard},function(err,doc){
				//纯属娱乐
				if(reqObj.content<0){
					reqStr = 'idiot\n';
					socket.end(reqStr);
				}
				if(err){
					console.log(err);
					return;
				}
				//如果余额不足
				if(reqObj.content - doc.balance>0){
					reqStr = 'ERR 402\n';
					socket.write(reqStr);
				}
				else{
					doc.balance = doc.balance - reqObj.content;
					doc.save();
					reqStr = 'OK\n';
					socket.write(reqStr);
				}
			})
		}
		// 用户走了
		else if(reqObj.status === 'BYE'){
			// 回复BYE
			console.log('完成交易，断开连接')
			reqStr = 'BYE\n';
			socket.end(reqStr);
		}
		// 无法识别正确的状态码
		else{
			// 发送错误码400
			console.log('无法识别的请求')
			socket.write('400\n')
		}
	})
})
// 监听客户端连接
server.listen(3000);
// 开始监听
server.on('listening',function(){
	console.log('server is listening');
});
/**
 * 服务器故障的事件处理函数
 */
server.on('error',function(err){
	console.log(error);
})
/**
 * 服务器关闭时的事件处理函数
 */
server.on('close',function(){
	console.log('server close!')
})

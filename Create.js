const mongoose = require('mongoose')

const url = 'mongodb://localhost:27017/ATM';

mongoose.connect(url,{useNewUrlParser:true},function(err){
	if(err){
		console.log('connect failed')
	}
	else{
		console.log('connect success')
	}
});

var mySchema = new mongoose.Schema({
	cardNum:String,
	passWord:String,
	balance:Number
});

var myModel = mongoose.model('user',mySchema);

//还原数据库
myModel.find(function(err,data){
	if(err){
		console.log(err)
	}
	else {
		data[0].balance = 250;
		data[1].balance = 80000000;
		data[2].balance = 163546;
		data[3].balance = 1500;
		data.forEach(function(element, index) {
			// statements
			element.save();
		});
	}
})

// var entity = new myModel({
// 	cardNum:50010120171701,
// 	passWord:654321,
// 	balance:80000000
// });

// entity.save((err,doc)=>{
// 	if(err){
// 		console.log(err)
// 	}
// 	else {
// 		console.log(doc)
// 	}
// })
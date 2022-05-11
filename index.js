// Gõ lệnh node index.js để bắt đầu chạy server nodejs

var express = require('express')  // Module xử lí chung
var mysql = require('mysql2')     // Module cho phép sử dụng cơ sở dữ liệu mySQL 
var mqtt = require('mqtt')        // Module cho phép sử dụng giao thức mqtt

var app = express()
var port = 6060                   // Port của localhost do mình chọn

var exportCharts = require('./export.js') 
const { getPackedSettings } = require('http2');// Require file export.js

app.use(express.static("public"))
app.set("views engine", "ejs")
app.set("views", "./views")

var server = require("http").Server(app)
var io = require('socket.io')(server)

app.get('/', function (req, res) {
    res.render('home.ejs')
})

app.get('/history', function (req, res) {
    res.render('history.ejs')
})

server.listen(port, function () {
    console.log('Server listening on port ' + port)
})

//---------------------- MQTT -------------------------
var options = {
	username: "IB12345",
	password: "12345",
	clientId: "giang",
};
// initialize the MQTT client
var client = mqtt.connect('mqtt://203.162.10.118:8800', options);
// declare topics
var topic1 = 'led1';
var topic2 = 'led2';
var topic3 = 'led3';

var topic_list = ['home/sensors/esp'];

console.log("connected flag  " + client.connected);
client.on("connect", function () {
    console.log("connected mqtt " + client.connected);
});

client.on("error", function (error) {
    console.log("Can't connect" + error);
    process.exit(1)
});

client.subscribe('home/sensors/esp');

// SQL--------Temporarily use PHPMyAdmin------------------------------
var con = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'sammy',
    password: 'Hieu1310$',
    database: 'hieu_database'
});

//---------------------------------------------CREATE TABLE-------------------------------------------------
con.connect(function (err) {
    if (err) throw err;
    console.log("mysql connected");
    var sql = "CREATE TABLE IF NOT EXISTS sensors11(ID int(10) not null primary key auto_increment, Time datetime not null, Temperature int(3) not null, Humidity int(3) not null, Light int(5) not null )"
    con.query(sql, function (err) {
        if (err)
            throw err;
        console.log("Table created");
    });
})

var humi_graph = [];
var temp_graph = [];
var date_graph = [];
var light_graph = [];

var m_time
var newTemp
var newHumi
var newLight

//--------------------------------------------------------------------
var cnt_check = 0;
client.on('message', function (topic, message, packet) {
    console.log("message is " + message)
    console.log("topic is " + topic)
    const objData = JSON.parse(message)
    if (topic == topic_list[0]) {
        cnt_check = cnt_check + 1
        newTemp  = objData.Temperature;
        newHumi  = objData.Humidity;
        newLight = objData.Light;
    }

    if (cnt_check == 1) {
        cnt_check = 0

        console.log("ready to save")
        var n = new Date()
        var month = n.getMonth() + 1
        var Date_and_Time = n.getFullYear() + "-" + month + "-" + n.getDate() + " " + n.getHours() + ":" + n.getMinutes() + ":" + n.getSeconds();

        var sql = "INSERT INTO sensors11 (Time, Temperature, Humidity, Light) VALUES ('" + Date_and_Time.toString() + "', '" + newTemp + "', '" + newHumi + "', '" + newLight + "')"
        con.query(sql, function (err, result) {
            if (err) throw err;
            console.log("Table inserted");
            console.log(Date_and_Time + " " + newTemp + " " + newHumi + " " + newLight)
        });

        exportCharts(con, io)
    }
})

//----Socket---------Control devices----------------------------

io.on('connection', function (socket) {
    console.log(socket.id + " connected")
    socket.on('disconnect', function () {
        console.log(socket.id + " disconnected")
    })

    socket.on('LED1', function (data) {
		if (data == 'on') {
			console.log('Livingroom light ON');
			client.publish(topic1, 'On');
		} else {
			console.log('Livingroom light OFF');
			client.publish(topic1, 'Off');
		}
	});

    socket.on('LED2', function (data) {
		if (data == 'on') {
			console.log('Livingroom air conditioner ON');
			client.publish(topic2, 'On');
		} else {
			console.log('Livingroom air conditioner OFF');
			client.publish(topic2, 'Off');
		}
	});
	socket.on('LED3', function (data) {
		if (data == 'on') {
			console.log('Television ON');
			client.publish(topic3, 'On');
		} else {
			console.log('Television OFF');
			client.publish(topic3, 'Off');
		}
	});
    // Send data to History page
    var sql1 = "SELECT * FROM sensors11 ORDER BY ID"
    con.query(sql1, function (err, result, fields) {
        if (err) throw err;
        console.log("Full Data selected");
        var fullData = []
        result.forEach(function (value) {
            var m_time = value.Time.toString().slice(4, 24);
            var t = value.Light;
            fullData.unshift({ id: value.ID, time: m_time, temp: value.Temperature, humi: value.Humidity , light: t})
        })
        io.sockets.emit('send-full', fullData)
    })
})

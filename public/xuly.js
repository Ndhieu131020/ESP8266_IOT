var socket = io("http://localhost:6060")

socket.on("server-update-data", function (data) {

    // Home page
    $("#currentTemp").html(data.temp)
    $("#currentHumi").html(data.humi)
    $("#currentLight").html(data.light)

    // Warning mode
    var warningSection = document.getElementById("warningSection")
    if (data.temp > 40 || data.humi < 60) {
        warningSection.classList.add("warning-mode-on")
    } else {
        warningSection.classList.remove("warning-mode-on")
    }

    //History page
    $("#id-content").append("<div class='h-para'>" + data.id + "</div>")
    $("#time-content").append("<div class='h-para'>" + data.time + "</div>")
    $("#temp-content").append("<div class='h-para'>" + data.temp + "</div>")
    $("#humi-content").append("<div class='h-para'>" + data.humi + "</div>")
    $("#light-content").append("<div class='h-para'>" + Math.round(data.Light * 100) / 100 + "</div>")
})

socket.on("send-full", function (data) {

    // History page
    $("#time-content").html("")
    $("#temp-content").html("")
    $("#humi-content").html("")
    $("#light-content").html("")
    $("#id-content").html("")
    console.log(data)
    data.forEach(function (item) {
        $("#time-content").append("<div class='h-para'>" + item.time + "</div>")
        $("#temp-content").append("<div class='h-para'>" + item.temp + "</div>")
        $("#humi-content").append("<div class='h-para'>" + item.humi + "</div>")
        $("#light-content").append("<div class='h-para'>" + item.light + "</div>")
        $("#id-content").append("<div class='h-para'>" + item.id + "</div>")
    })
})

// ---- Control devices ----
function livingroomLight() {
    var checkBox = document.getElementById("livingroomLight");
    if (checkBox.checked == true) {
        //alert('LED On')
        socket.emit("LED1", "on")
    } else {
        // alert('LED Off')
        socket.emit("LED1", "off")
    }
}

function livingroomAirConditioner() {
    var checkBox = document.getElementById("livingroomAirConditioner");
    if (checkBox.checked == true) {
        //alert('LED On')
        socket.emit("LED2", "on")
    } else {
        // alert('LED Off')
        socket.emit("LED2", "off")
    }
}

function television() {
    var checkBox = document.getElementById("television");
    if (checkBox.checked == true) {
        //alert('LED On')
        socket.emit("LED3", "on")
    } else {
        // alert('LED Off')
        socket.emit("LED3", "off")
    }
}

// ---- RTC ----




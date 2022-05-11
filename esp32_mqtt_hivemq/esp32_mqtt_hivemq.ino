
#include <PubSubClient.h>
#include <ESP8266WiFi.h>
#include "DHT.h"
#include "ArduinoJson.h"


// Thông tin về wifi
#define ssid "Hung"
#define password "hungnh06"
// thong tin mqtt
#define mqtt_server IPAddress (203, 162, 10, 118)
#define mqtt_port 8800
#define mqttUser "IB12345"
#define mqttPass "12345"

#define topic1 "home/sensors/esp"

#define DHTPIN D5
#define DHTTYPE DHT11

DHT dht(DHTPIN, DHTTYPE);

WiFiClient espClient;
PubSubClient client(espClient);

void setup()
{
  Serial.begin(115200);

  setup_wifi();                             //thực hiện kết nối Wifi
  client.setServer(mqtt_server, mqtt_port); // cài đặt server và lắng nghe client ở port 1883
  client.setCallback(callback);             // gọi hàm callback để thực hiện các chức năng publish/subcribe

  if (!client.connected())
  { // Kiểm tra kết nối
    reconnect();
  }
  client.subscribe("led1");
  client.subscribe("led2");
  client.subscribe("led3");

  pinMode(D1, OUTPUT); // livingroomLight
  pinMode(D2, OUTPUT); // livingroomAirConditioner
  pinMode(D3, OUTPUT); // television

  dht.begin();
}

// Hàm kết nối wifi
void setup_wifi()
{
  delay(10);
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED)
  {
    delay(500);
    Serial.print(".");
  }
  // in ra thông báo đã kết nối và địa chỉ IP của ESP8266
  Serial.println("");
  Serial.println("WiFi connected");
  Serial.println("IP address: ");
  Serial.println(WiFi.localIP());
}

// Hàm call back để nhận dữ liệu
void callback(char *topic, byte *payload, unsigned int length)
{
  //-----------------------------------------------------------------
  //in ra tên của topic và nội dung nhận được
  Serial.print("Co tin nhan moi tu topic: ");
  Serial.println(topic);
  char p[length + 1];
  memcpy(p, payload, length);
  p[length] = NULL;
  String message(p);

  if (String(topic) == "led1")
  {
    if (message == "On")
    {
      digitalWrite(D1, HIGH);
    }
    if (message == "Off")
    {
      digitalWrite(D1, LOW);
    }
  }

  if (String(topic) == "led2")
  {
    if (message == "On")
    {
      digitalWrite(D2, HIGH);
    }
    if (message == "Off")
    {
      digitalWrite(D2, LOW);
    }
  }

  if (String(topic) == "led3")
  {
    if (message == "On")
    {
      digitalWrite(D3, HIGH);
    }
    if (message == "Off")
    {
      digitalWrite(D3, LOW);
    }
  }

  Serial.println(message);
  //Serial.write(payload, length);
  Serial.println();
  //-------------------------------------------------------------------------
}

// Hàm reconnect thực hiện kết nối lại khi mất kết nối với MQTT Broker
void reconnect()
{
  while (!client.connected()) // Chờ tới khi kết nối
  {
    if (client.connect("Giang", mqttUser, mqttPass)) //kết nối vào broker
    {
      Serial.println("Đã kết nối:");
      //đăng kí nhận dữ liệu từ topic
      client.subscribe("led1");
      client.subscribe("led2");
      client.subscribe("led3");
    }
    else
    {
      // in ra trạng thái của client khi không kết nối được với broker
      Serial.print("Lỗi:, rc=");
      Serial.print(client.state());
      Serial.println(" try again in 5 seconds");
      // Đợi 5s
      delay(5000);
    }
  }
}

long lastMsg = 0;
void loop()
{
  //  if (!client.connected()){// Kiểm tra kết nối
  //    reconnect();
  //  }
  client.loop();

  long now = millis();
  if (now - lastMsg > 6000)
  {
    lastMsg = now;
    int h = dht.readHumidity();
    // Read temperature as Celsius (the default)
    int t = dht.readTemperature();
    
    int light = analogRead(A0);
    
    char lightString[10];
    sprintf(lightString, "%d", light);
    Serial.print("  Light: ");
    Serial.print(lightString);

    char tempString[10];
    sprintf(tempString, "%d", t);
    Serial.print("  Temperature: ");
    Serial.print(tempString);

    char humiString[10];
    sprintf(humiString, "%d", h);
    Serial.print("  Humidity: ");
    Serial.println(humiString);

    StaticJsonDocument<100> doc;
    doc["Temperature"] = t;
    doc["Humidity"] = h;
    doc["Light"] = light;

    char buffer[100];
    serializeJson(doc, buffer);
    client.publish(topic1, buffer);
    Serial.println(buffer);
  }
}

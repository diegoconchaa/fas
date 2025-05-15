#include <WiFi.h>
#include <WebServer.h>
#include <ArduinoJson.h>

const char* ssid = "Network";
const char* password = "96395157";

const int voltageRPM = 32;
WebServer server(80);

unsigned long lastZeroTime = 0;
bool lastWasZero = false;
float fanRpm = 0.0;

void sendCORSHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

void handleRpm() {
  StaticJsonDocument<200> doc;
  doc["rpm"] = fanRpm;
  String response;
  serializeJson(doc, response);
  sendCORSHeaders();
  server.send(200, "application/json", response);
}

void setup() {
  // Serial for debugging
  Serial.begin(115200);

  // Initialize Wi-Fi
  WiFi.begin(ssid, password);
  Serial.print("Connecting to WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println();
  Serial.print("WiFi connected, IP address: ");
  Serial.println(WiFi.localIP());
  pinMode(voltageRPM, INPUT);
  server.on("/rpm", handleRpm);
  server.on("/rpm", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(204);
  });
  server.begin();
}

void loop() {
  server.handleClient();
  int rawValue = analogRead(voltageRPM);
  float voltage = (rawValue / 4095.0) * 3.3;
  if (voltage < 0.01) {
    if (!lastWasZero) {
      unsigned long currentTime = millis();
      if (lastZeroTime != 0) {
        unsigned long timeBetweenZeros = currentTime - lastZeroTime;
        if (timeBetweenZeros > 10) {
          fanRpm = 30000.0 / timeBetweenZeros;
        }
      }
      lastZeroTime = currentTime;
      lastWasZero = true;
    }
  } else {
    lastWasZero = false;
  }
}

#include <WiFi.h>
#include <WebServer.h>
#include <TFT_eSPI.h>
#include <Wire.h>
#include <Adafruit_AMG88xx.h>
#include <Adafruit_ADXL345_U.h>    // Replaced MPU6050 library with ADXL345
#include <Adafruit_Sensor.h>
#include "xbm.h"                   // Sketch tab header for xbm images
#include <ArduinoJson.h>           // Include ArduinoJson library

// ===================== PIN DEFINITIONS =====================

// LM35 sensor pin
#define LM35_PIN       33 // GPIO33 (ADC1_CH5)

// Voltage input pin (if still needed for a generic voltage measurement)
#define VOLTAGE_PIN    32 // GPIO32 (ADC1_CH4)

// FZ0430 voltage sensor pin (adjust as needed)
#define FZ0430_PIN     34 // Example: GPIO34 (ADC1_CH6)

// ACS712 current sensor pin (adjust as needed)
#define ACS712_PIN     36 // Example: GPIO36

// PWM output pin (fan control, etc.)
#define PWM_PIN        25 // GPIO25

// I2C pins (ESP32 default)
#define SDA_PIN        21
#define SCL_PIN        22

// Button pins
#define BUTTON_LEFT_PIN  0   // GPIO0  - Left Button
#define BUTTON_RIGHT_PIN 35  // GPIO35 - Right Button (example, adjust if needed)

// ===================== OBJECTS & GLOBALS =====================
TFT_eSPI tft = TFT_eSPI();
WebServer server(80);

Adafruit_AMG88xx amg;       
Adafruit_ADXL345_Unified adxl = Adafruit_ADXL345_Unified(12345);

int pwmValue = 0;  // PWM value for fan control

const char* ssid = "Network";      // Replace with your Wi-Fi SSID
const char* password = "96395157"; // Replace with your Wi-Fi password

// Cache for ADXL345 at 100Hz
sensors_event_t cachedAccelEvent;
unsigned long lastMPUReadTime = 0;
const unsigned long mpuReadInterval = 10; // Read every 10 ms (100 Hz)

// Update display
unsigned long lastDisplayUpdateTime = 0;
const unsigned long displayUpdateInterval = 500;

// Button read timing
unsigned long lastButtonReadTime = 0;
const unsigned long buttonReadInterval = 250;

String ipAddress;

// PWM control variables
int pwmLevel = 0;             
const int maxPwmLevel = 10;   

// Button press timing variables
unsigned long buttonLeftPressedTime = 0;
unsigned long buttonRightPressedTime = 0;
const unsigned long longPressDuration = 1000; // 1 second for long press

// Last button states
bool buttonLeftLastState = HIGH;
bool buttonRightLastState = HIGH;

// ===================== CORS HELPER =====================
void sendCORSHeaders() {
  server.sendHeader("Access-Control-Allow-Origin", "*");
  server.sendHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  server.sendHeader("Access-Control-Allow-Headers", "Content-Type");
}

// ===================== HANDLERS =====================

// Handle LM35 - returns {"value": <number>}
void handleLM35() {
  int analogValue = analogRead(LM35_PIN);
  float voltage = analogValue * (3.3 / 4095.0);
  float temperatureC = voltage * 100.0;

  StaticJsonDocument<200> jsonResponse;
  jsonResponse["value"] = temperatureC;

  String response;
  serializeJson(jsonResponse, response);

  sendCORSHeaders();
  server.send(200, "application/json", response);
}

// Handle Voltage (generic) - returns {"value": <number>}
// NOTE: If the FZ0430 is replacing your old voltage sensor, you can remove or repurpose this.
void handleVoltage() {
  int analogValue = analogRead(VOLTAGE_PIN);
  float voltage = analogValue * (3.3 / 4095.0);
  float inputVoltage = voltage * (5.0 / 3.3);

  StaticJsonDocument<200> jsonResponse;
  jsonResponse["value"] = inputVoltage;

  String response;
  serializeJson(jsonResponse, response);

  sendCORSHeaders();
  server.send(200, "application/json", response);
}

// Handle ADXL345 - returns {"x": <number>, "y": <number>, "z": <number>}
void handleADXL345() {
  StaticJsonDocument<200> jsonResponse;
  jsonResponse["x"] = cachedAccelEvent.acceleration.x;
  jsonResponse["y"] = cachedAccelEvent.acceleration.y;
  jsonResponse["z"] = cachedAccelEvent.acceleration.z;

  String response;
  serializeJson(jsonResponse, response);

  sendCORSHeaders();
  server.send(200, "application/json", response);
}

// Handle AMG8833 - returns {"grid": [[8 values], [8 values], ...]}
void handleAMG8833() {
  float pixels[64];
  amg.readPixels(pixels);

  StaticJsonDocument<2048> jsonResponse; // Larger document for 8x8 data
  JsonArray grid = jsonResponse.createNestedArray("grid");

  for (int row = 0; row < 8; row++) {
    JsonArray rowArray = grid.createNestedArray();
    for (int col = 0; col < 8; col++) {
      rowArray.add(pixels[row * 8 + col]);
    }
  }

  String response;
  serializeJson(jsonResponse, response);

  sendCORSHeaders();
  server.send(200, "application/json", response);
}

// Handle setPWM - sets PWM (0-255)
void handleSetPWM() {
  if (server.hasArg("value")) {
    sendCORSHeaders();
    String valueStr = server.arg("value");
    int value = valueStr.toInt();
    if (value >= 0 && value <= 255) {
      pwmValue = value;
      analogWrite(PWM_PIN, pwmValue);
      server.send(200, "text/plain", "PWM value set to " + String(pwmValue));
    } else {
      server.send(400, "text/plain", "Invalid PWM value. Must be between 0 and 255.");
    }
  } else {
    server.send(400, "text/plain", "PWM value not provided.");
  }
}

// ===================== NEW SENSOR HANDLERS =====================

/**
 * Handle FZ0430 Voltage Sensor
 * Returns {"value": <voltage>}
 * 
 * Adjust the multiplication factor based on your actual FZ0430 ratio.
 */
void handleFZ0430() {
  int rawValue = analogRead(FZ0430_PIN);
  // Convert raw ADC reading to voltage (3.3V range, 12-bit ADC => max 4095)
  float measuredVoltage = rawValue * (3.3f / 4095.0f);

  // FZ0430 modules often step down higher voltages to ~3.3V range.
  // Adjust the scaling factor to match your sensor's specs.
  // For example, if the sensor divides input voltage by 5:
  float actualVoltage = measuredVoltage * 5.0f;

  StaticJsonDocument<200> doc;
  doc["value"] = actualVoltage;

  String response;
  serializeJson(doc, response);

  sendCORSHeaders();
  server.send(200, "application/json", response);
}

/**
 * Handle ACS712 Current Sensor
 * Returns {"value": <current>}
 * 
 * Adjust offset and sensitivity based on your ACS712 variant:
 *  - ACS712 5A  => 185 mV/A
 *  - ACS712 20A => 100 mV/A
 *  - ACS712 30A => 66 mV/A
 */
void handleACS712() {
  int rawValue = analogRead(ACS712_PIN);
  // Convert raw ADC reading to voltage
  float sensorVoltage = rawValue * (3.3f / 4095.0f);

  // ACS712 outputs Vcc/2 at 0 A. For 3.3V supply, that's ~1.65 V offset.
  float offset = 3.3f / 2.0f;  
  // Sensitivity in V/A (adjust as appropriate)
  float sensitivity = 0.185f; // for a 5A version

  float current = (sensorVoltage - offset) / sensitivity;

  StaticJsonDocument<200> doc;
  doc["value"] = current;

  String response;
  serializeJson(doc, response);

  sendCORSHeaders();
  server.send(200, "application/json", response);
}

// ===================== SETUP =====================
void setup() {
  Serial.begin(115200);

  tft.init();
  tft.setRotation(0);
  tft.fillScreen(TFT_BLACK);
  tft.setTextColor(TFT_WHITE, TFT_BLACK);
  tft.setTextSize(1);
  tft.setTextWrap(true);

  Wire.begin(SDA_PIN, SCL_PIN);
  Wire.setClock(100000);

  tft.drawXBitmap(0, 240 - logoHeight - 25, logo, logoWidth, logoHeight, TFT_BLUE);

  pinMode(LM35_PIN, INPUT);
  pinMode(VOLTAGE_PIN, INPUT);
  pinMode(FZ0430_PIN, INPUT);
  pinMode(ACS712_PIN, INPUT);
  pinMode(PWM_PIN, OUTPUT);

  // Initialize AMG8833
  if (!amg.begin()) {
    Serial.println("Failed to initialize AMG8833!");
    tft.println("AMG8833 init failed!");
  } else {
    Serial.println("AMG8833 initialized.");
  }

  // Initialize ADXL345
  if (!adxl.begin()) {
    Serial.println("Failed to initialize ADXL345!");
    tft.println("ADXL345 init failed!");
  } else {
    Serial.println("ADXL345 initialized.");
  }

  pinMode(BUTTON_LEFT_PIN, INPUT_PULLUP);
  pinMode(BUTTON_RIGHT_PIN, INPUT_PULLUP);

  // Wi-Fi connection
  WiFi.begin(ssid, password);
  tft.println("Connecting to WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    delay(2000);
    Serial.print(".");
  }
  tft.println("WiFi connected!");
  ipAddress = WiFi.localIP().toString();
  tft.println(ipAddress);
  Serial.println(ipAddress);

  // ===================== ENDPOINTS =====================
  server.on("/lm35", handleLM35);
  server.on("/amg8833", handleAMG8833);
  server.on("/adxl345", handleADXL345);
  server.on("/voltage", handleVoltage);
  server.on("/setPWM", handleSetPWM);

  // New sensor endpoints
  server.on("/fz0430", handleFZ0430);
  server.on("/acs712", handleACS712);

  // OPTIONS handlers for CORS preflight if needed
  server.on("/lm35", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(204);
  });
  server.on("/amg8833", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(204);
  });
  server.on("/adxl345", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(204);
  });
  server.on("/voltage", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(204);
  });
  server.on("/setPWM", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(204);
  });
  server.on("/fz0430", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(204);
  });
  server.on("/acs712", HTTP_OPTIONS, []() {
    sendCORSHeaders();
    server.send(204);
  });

  server.begin();
  Serial.println("HTTP server started");
}

// ===================== LOOP =====================
void loop() {
  server.handleClient();

  unsigned long currentTime = millis();

  // ========== Handle Buttons ==========
  if (currentTime - lastButtonReadTime >= buttonReadInterval) {
    lastButtonReadTime = currentTime;

    bool buttonLeftState = digitalRead(BUTTON_LEFT_PIN);
    bool buttonRightState = digitalRead(BUTTON_RIGHT_PIN);

    // Handle Left Button
    if (buttonLeftLastState == HIGH && buttonLeftState == LOW) {
      buttonLeftPressedTime = currentTime;
    } else if (buttonLeftLastState == LOW && buttonLeftState == HIGH) {
      if (currentTime - buttonLeftPressedTime >= longPressDuration) {
        // Long press => reset PWM to 0
        pwmLevel = 0;
      } else {
        // Short press => decrease PWM level
        if (pwmLevel > 0) {
          pwmLevel--;
        }
      }
      pwmValue = (pwmLevel * 255) / maxPwmLevel;
      analogWrite(PWM_PIN, pwmValue);
    }

    // Handle Right Button
    if (buttonRightLastState == HIGH && buttonRightState == LOW) {
      buttonRightPressedTime = currentTime;
    } else if (buttonRightLastState == LOW && buttonRightState == HIGH) {
      if (currentTime - buttonRightPressedTime >= longPressDuration) {
        // Long press => set PWM to max
        pwmLevel = maxPwmLevel;
      } else {
        // Short press => increase PWM level
        if (pwmLevel < maxPwmLevel) {
          pwmLevel++;
        }
      }
      pwmValue = (pwmLevel * 255) / maxPwmLevel;
      analogWrite(PWM_PIN, pwmValue);
    }

    buttonLeftLastState = buttonLeftState;
    buttonRightLastState = buttonRightState;
  }

  // ========== Update ADXL345 Data ==========
  if (currentTime - lastMPUReadTime >= mpuReadInterval) {
    lastMPUReadTime = currentTime;
    sensors_event_t accelEvent;
    adxl.getEvent(&accelEvent);
    cachedAccelEvent = accelEvent;
  }

  // ========== Update Display ==========
  if (currentTime - lastDisplayUpdateTime >= displayUpdateInterval) {
    lastDisplayUpdateTime = currentTime;
    tft.fillScreen(TFT_BLACK);
    tft.setCursor(0, 0);

    // ---- LM35 ----
    int lm35Raw = analogRead(LM35_PIN);
    float lm35Voltage = lm35Raw * (3.3f / 4095.0f);
    float temperatureC = lm35Voltage * 100.0f;
    tft.printf("LM35 Temp: %.2f C\n", temperatureC);

    // ---- Original "Voltage" reading (if used) ----
    int analogValue = analogRead(VOLTAGE_PIN);
    float voltage = analogValue * (3.3f / 4095.0f);
    float inputVoltage = voltage * (5.0f / 3.3f);
    tft.printf("Voltage: %.2f V\n", inputVoltage);

    // ---- FZ0430 Voltage Sensor ----
    int fzRaw = analogRead(FZ0430_PIN);
    float measuredVoltageFZ = fzRaw * (3.3f / 4095.0f);
    float fzVoltage = measuredVoltageFZ * 5.0f;  // Adjust factor to match your sensor
    tft.printf("FZ0430: %.2f V\n", fzVoltage);

    // ---- ACS712 Current Sensor ----
    int acsRaw = analogRead(ACS712_PIN);
    float sensorVoltageACS = acsRaw * (3.3f / 4095.0f);
    float offset = 3.3f / 2.0f;     // 1.65 V for 3.3 V supply
    float sensitivity = 0.185f;    // Example for ACS712 (5A version)
    float currentACS = (sensorVoltageACS - offset) / sensitivity;
    tft.printf("ACS712: %.2f A\n", currentACS);

    // ---- ADXL345 Cached Data ----
    tft.printf("ADXL345 Accel:\nX: %.2f\nY: %.2f\nZ: %.2f\n",
               cachedAccelEvent.acceleration.x,
               cachedAccelEvent.acceleration.y,
               cachedAccelEvent.acceleration.z);

    // ---- AMG8833 Average Temp ----
    float pixels[64];
    amg.readPixels(pixels);
    float avgTemp = 0;
    for (int i = 0; i < 64; i++) {
      avgTemp += pixels[i];
    }
    avgTemp /= 64.0f;
    tft.printf("AMG8833: %.2f C\n", avgTemp);

    // ---- PWM ----
    float speedPWM = 100.0f * pwmValue / 255.0f;
    tft.printf("PWM: %.2f%%\n\n", speedPWM);

    // ---- Logo & IP ----
    tft.drawXBitmap(0, 240 - logoHeight - 25, logo, logoWidth, logoHeight, TFT_BLUE);
    tft.println("\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\n\nIP: " + ipAddress);
  }
}

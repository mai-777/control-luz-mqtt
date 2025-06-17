// --- Configuración del broker MQTT ---
// Usa el mismo broker que tu ESP32
const mqttBroker = "broker.hivemq.com";
// Para WebSockets, HiveMQ Public Broker usa el puerto 8000
const mqttPort = 8000;
const mqttClientId = "web_control_client_" + parseInt(Math.random() * 1000);

// --- Topics MQTT (deben coincidir con los de tu ESP32) ---
const MQTT_TOPIC_CONTROL = "casa/puerta/luz/control";
const MQTT_TOPIC_ESTADO = "casa/puerta/luz/estado";

// Elemento HTML para mostrar el estado
const focusStateElement = document.getElementById("focusState");

// Crear un nuevo cliente MQTT
const client = new Paho.MQTT.Client(mqttBroker, mqttPort, mqttClientId);

// Asignar funciones de callback
client.onConnectionLost = onConnectionLost;
client.onMessageArrived = onMessageArrived;

// --- Conectar al broker ---
client.connect({ onSuccess: onConnect, useSSL: false }); // useSSL: false porque usamos puerto 8000 (no SSL)

function onConnect() {
    console.log("Conectado al broker MQTT con ID: " + mqttClientId);
    // Suscribirse a los topics relevantes
    client.subscribe(MQTT_TOPIC_ESTADO); // Para recibir el estado actual del foco
    console.log("Suscrito al topic: " + MQTT_TOPIC_ESTADO);
}

function onConnectionLost(responseObject) {
    if (responseObject.errorCode !== 0) {
        console.error("Conexión MQTT perdida: " + responseObject.errorMessage);
        focusStateElement.innerText = "Desconectado";
        focusStateElement.className = "status-unknown"; // Restaurar estilo a gris
        // Intentar reconectar después de un tiempo
        setTimeout(() => client.connect({ onSuccess: onConnect, useSSL: false }), 5000);
    }
}

function onMessageArrived(message) {
    console.log("Mensaje recibido en [" + message.topic + "]: " + message.payloadString);

    // Si el mensaje es del topic de estado
    if (message.topic === MQTT_TOPIC_ESTADO) {
        const estado = message.payloadString;
        if (estado === "LED_ON") {
            focusStateElement.innerText = "ENCENDIDO";
            focusStateElement.className = "status-on";
        } else if (estado === "LED_OFF") {
            focusStateElement.innerText = "APAGADO";
            focusStateElement.className = "status-off";
        } else if (estado === "ESP32_CONECTADA") {
            console.log("ESP32 conectada y activa.");
            // MODIFICACIÓN AÑADIDA: Actualizar el texto para indicar que la ESP32 está en línea
            focusStateElement.innerText = "Esperando estado..."; // O "En línea"
            focusStateElement.className = "status-unknown"; // Mantiene el color gris
        } else {
            focusStateElement.innerText = "Estado Desconocido: " + estado;
            focusStateElement.className = "status-unknown";
        }
    }
}

// --- Función para publicar un mensaje de control ---
function publishMessage(command) {
    // 'command' será 'ON' o 'OFF'
    const message = new Paho.MQTT.Message(command);
    message.destinationName = MQTT_TOPIC_CONTROL;
    client.send(message);
    console.log("Comando publicado en [" + MQTT_TOPIC_CONTROL + "]: " + command);
}
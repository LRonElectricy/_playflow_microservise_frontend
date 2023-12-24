<template>
  <div>
    <div v-for="msg in messages" :key="msg.id">
      {{ msg.text }} - {{ msg.id  }}
    </div>
    <v-divider></v-divider>
    <div v-for="msg in messages_mqtt" :key="msg.id">
      {{ msg.text }} -  {{ msg.id  }}
    </div>
    <v-divider></v-divider>
    <button @click="sendMessage('Привет, сервер, попытка номер 2!')">Отправить Сообщение</button>
  </div>
</template>

<script>
import io from 'socket.io-client';

export default {
  data() {
    return {
      socket: null,
      messages: [],
      messages_mqtt: [],
      nextMessageId: 0
    };
  },
  created() {
    // Подключение к WebSocket серверу
    this.socket = io('http://localhost:3000');

    // Обработка входящих сообщений
    this.socket.on('message', (message) => {
      console.log('Получено сообщение:', message);
      this.messages.push({ text: message, id: this.nextMessageId++ });
    });
    this.socket.on('mqtt_message', (message) => {
      console.log('Получено сообщение mqtt:', message);
      this.messages_mqtt.push({ text: message, id: this.nextMessageId++ });
    });
  },
  methods: {
    sendMessage(message) {
      // Отправка сообщения на сервер
      this.socket.emit('message', message);
      console.log('Отправлено сообщение:', message);
    }
  }
};
</script>

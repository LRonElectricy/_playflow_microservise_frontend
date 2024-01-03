import Vue from 'vue';
import App from './App.vue';
import './registerServiceWorker';
import router from './router';
import store from './store';
import vuetify from './plugins/vuetify';
//firebase
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/firestore';
import 'firebase/compat/database'

//socket.io
import io from 'socket.io-client';

//socket.io
const socket = io('http://localhost:3000');

const firebaseConfig = {
  apiKey: "AIzaSyDMaX2bDL4on35RNgo_UbKiwJZDl1iKZN4",
  authDomain: "playflow-microservises.firebaseapp.com",
  databaseURL: "https://playflow-microservises-default-rtdb.firebaseio.com",
  projectId: "playflow-microservises",
  storageBucket: "playflow-microservises.appspot.com",
  messagingSenderId: "791402970652",
  appId: "1:791402970652:web:37a7cb843975bfc46069d9"
};

Vue.config.productionTip = false;

// Создаем экземпляр Vue после проверки аутентификации
let app = null;

var fire = firebase.initializeApp(firebaseConfig);
// Ожидаем изменения статуса аутентификации перед созданием экземпляра Vue
firebase.auth().onAuthStateChanged(user => {
  if (!app) {
    app = new Vue({
      router,
      store,
      vuetify,
      render: h => h(App)
    }).$mount('#app');
  }

  // Теперь доступен объект user
  if (user) {
    console.log('Пользователь залогинен', user);
    // Здесь можно установить начальные данные для пользователя
    store.dispatch('fetchUser', user);
  } else {
    console.log('Пользователь не залогинен');
    store.dispatch('fetchUser', null);
    // go to home page
    router.push('/');
    // Можно выполнить действия для неаутентифицированных пользователей
  }
});

export { fire, socket };

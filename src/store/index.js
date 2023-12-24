import Vue from 'vue';
import Vuex from 'vuex';
import { getAuth, onAuthStateChanged } from 'firebase/auth';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    user: null
  },
  mutations: {
    setUser(state, user) {
      console.log('store: setUser');
      console.log("user: ", user);
      state.user = user;
    },
    clearUser(state) {
      console.log('store: clearUser');
      state.user = null;
    },
  },
  actions: {
    fetchUser({ commit }) {
      const auth = getAuth();
      onAuthStateChanged(auth, (user) => {
        commit('setUser', user);
      });
    },
    clearUser({ commit }) {
      commit('clearUser');
    },
  },
  getters: {
    isAuthenticated: state => !!state.user,
    currentUser: state => state.user
  }
});

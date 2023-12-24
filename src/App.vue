<template>
  <v-app>
    <v-app-bar app color="primary" dark>
      <!-- Логотип PlayFlow -->
      <v-img alt="PlayFlow Logo" class="shrink mr-2" contain src="@/assets/playFlow.png"
        transition="scale-transition"
        width="40"
        />

        <!-- Имя пользователя, если он залогинен -->
        <span v-if="isAuthenticated">{{ userName }}</span>

        <v-spacer></v-spacer>

        <!-- Кнопка выхода, отображается только для залогиненных пользователей -->
        <v-btn v-if="isAuthenticated" @click="logout" text>
          Logout
        </v-btn>

        <!-- Кнопка Latest Release -->
        <!-- <v-btn href="https://github.com/vuetifyjs/vuetify/releases/latest" target="_blank" text>
        <span class="mr-2">Latest Release</span>
        <v-icon>mdi-open-in-new</v-icon>
      </v-btn> -->
    </v-app-bar>

    <v-main>
      <router-view />
    </v-main>
  </v-app>
</template>

<script>
import { mapGetters } from 'vuex';
import { getAuth, signOut } from 'firebase/auth';

export default {
  name: 'App',
  computed: {
    ...mapGetters(['isAuthenticated', 'currentUser']),
    userName() {
      return this.currentUser ? this.currentUser.displayName || this.currentUser.email : '';
    }
  },
  methods: {
    logout() {
      const auth = getAuth();
      signOut(auth).then(() => {
        // Очистить данные пользователя в store
        this.$store.commit('clearUser');
        // go to home page
        this.$router.push('/');
        // Перенаправить на страницу входа или на главную
        // this.$router.push('/login');
      }).catch((error) => {
        console.error('Error during sign out:', error);
      });
    }
  }
};
</script>

<template>
  <div class="home">
    <HelloWorld msg="Welcome to Your Vue.js App"/>
    <QuestRoomManager v-if="isAuthenticated"/>
    <!-- Показать login только если пользователь не аутентифицирован -->
    <login v-if="!isAuthenticated"/>
  </div>
</template>

<script>
import HelloWorld from '@/components/HelloWorld.vue'
import login from '@/components/login.vue'
import QuestRoomManager from '@/components/QuestRoomManager.vue'
import { mapGetters } from 'vuex';

export default {
  name: 'Home',
  components: {
    HelloWorld,
    login,
    QuestRoomManager
  },
  computed: {
    ...mapGetters(['isAuthenticated'])
  }
}
</script>

<template>
    <div>
        <div v-if="questRoom">
            <h1>{{ questRoom.name }}</h1>
            <p>Created at: {{ formatDate(questRoom.createdAt) }}</p>
            <p>Last updated at: {{ formatDate(questRoom.lastUpdatedAt) }}</p>
            <v-divider></v-divider>
            <v-btn @click="editMode = !editMode">Edit</v-btn>
        </div>
        <QuestsAndLinesManager v-if="userId && questRoomID !== '' && editMode" :questRoomId="questRoomID"
            :userId="userId" />
    </div>
</template>
<script>
import QuestsAndLinesManager from '@/components/edit/QuestsAndLinesManager.vue';
//importing user from store
import { mapGetters } from 'vuex';
import fire from '@/main';
export default {
    data() {
        return {
            questRoomID: '', // id of quest room
            questRoom: null, // quest room object
            editMode: false, // edit mode
        };
    },
    components: {
        QuestsAndLinesManager
    },
    computed: {
        ...mapGetters(['isAuthenticated', 'currentUser']),
        userId() {
            if (!this.isAuthenticated) {
                return null;
            }
            if (!this.currentUser) {
                return null;
            }
            return this.currentUser.uid;
        }
    },
    async created() {
        this.questRoomID = this.$route.params.id;
        await this.loadQuestRoom();
    },
    methods: {
        async loadQuestRoom() {
            const db = fire.database();
            const questRoomRef = db.ref('users/' + this.userId + '/questRooms/' + this.questRoomID);
            const snapshot = await questRoomRef.once('value');
            if (snapshot.exists()) {
                const questRoomData = snapshot.val();
                this.questRoom = {
                    id: this.questRoomID,
                    ...questRoomData
                };
                console.log("Quest room loaded");
                console.log("this.questRoom: ", this.questRoom);
            } else {
                console.log("No quest room found");
            }
        },
    },
};
</script>
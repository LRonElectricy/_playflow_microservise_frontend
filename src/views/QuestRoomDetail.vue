<template>
    <div>
        <div v-if="questRoom">
            <h1>{{ questRoom.name }}
                <v-btn icon @click="edit">
                    <v-icon :color="editMode ? 'red' : 'green'">{{ editMode ? 'mdi-close' : 'mdi-pencil' }}</v-icon>
                </v-btn>
                <v-btn icon @click="play">
                    <v-icon :color="playMode ? 'red' : 'green'">{{ playMode ? 'mdi-stop' : 'mdi-play' }}</v-icon>
                </v-btn>
            </h1>
            <p>Created at: {{ formatDate(questRoom.createdAt) }}</p>
            <p>Last updated at: {{ formatDate(questRoom.lastUpdatedAt) }}</p>
            <v-divider></v-divider>
        </div>
        <div v-if="editMode">
            <v-btn block @click="forceUnfoldAll = !forceUnfoldAll">
                {{ forceUnfoldAll ? 'Fold All' : 'Unfold All' }}
                <v-icon>{{ forceUnfoldAll ? 'mdi-arrow-collapse' : 'mdi-arrow-expand' }}</v-icon>
            </v-btn>
            <v-divider></v-divider>
            <QuestsAndLinesManager v-if="userId && questRoomID !== ''" :questRoomId="questRoomID" :userId="userId"
                :forceUnfoldAll="forceUnfoldAll" />
        </div>
        <div v-if="playMode">
            <p>Play mode</p>
        </div>
    </div>
</template>
<script>
import QuestsAndLinesManager from '@/components/edit/QuestsAndLinesManager.vue';
//importing user from store
import { mapGetters } from 'vuex';
import { fire } from '@/main';
export default {
    data() {
        return {
            questRoomID: '', // id of quest room
            questRoom: null, // quest room object
            editMode: false, // edit mode
            forceUnfoldAll: false, // force unfold all quests and quest lines
            playMode: false // play mode
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
        formatDate(date) {
            if (!date) return '';
            const d = new Date(date);
            return d.toLocaleString();
        },
        edit() {
            this.editMode = !this.editMode;
            if (!this.editMode) {
                this.forceUnfoldAll = false;
            } else {
                this.playMode = false;
            }
        },
        play() {
            this.playMode = !this.playMode;
            if (this.playMode) {
                this.editMode = false;
                this.forceUnfoldAll = false;
                this.$router.push('/play/' + this.questRoomID);
            }
        }
    },
};
</script>
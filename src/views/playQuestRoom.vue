<template>
    <div v-if="questRoom">
        <h1>{{ questRoom.name }}</h1>
        <v-btn block @click="reset()">RESET</v-btn>
        <v-btn block @click="start()">START</v-btn>
        <!-- make a narrow column with a list af all quest lines and quests, quest line is a title of a list, and its quests are the items -->
        <div v-if="questRoom.questLines">
            <div v-for="questLine in questRoom.questLines" :key="questLine.id">
                <h2>{{ questLine.name }}</h2>

                <div v-for="quest in questLine.quests" :key="quest.id">
                    <v-btn :disabled="quest.state !== 'RUN'" block @click="winQuest(quest.id)">{{ quest.name }}</v-btn>
                </div>
            </div>
        </div>
    </div>
</template>
<script>
import { mapGetters } from 'vuex';
import { socket } from '@/main';

export default {
    name: 'playQuestRoom',
    data() {
        return {
            loaded: false,
            questRoomId: '',
            questRoom: null,
        };
    },
    computed: {
        ...mapGetters(['currentUser']),
        socket() {
            return socket;
        },
    },
    async created() {
        console.log("creating playQuestRoom");
        this.questRoomId = await this.$route.params.id;
        console.log("this.questRoomId: ", this.questRoomId);
        let msg = {
            action: 'activate',
            name: 'questRoom',
            value: this.questRoomId,
        };
        this.socket.emit('fromFrontJSON', msg);
        this.socket.on('fromBackJSON', (res) => {
            let result = JSON.parse(res);
            //if result can be pursued as JSON
            if (result && typeof result === 'object' && result.constructor === Object) {
                console.log("result: ", result);
                if (result.action && result.value && result.name) {
                    if (result.action === 'sendLocalData' && result.name === 'questRoom') {
                        this.questRoom = result.value;
                        console.log("this.questRoom: ", this.questRoom);
                    }
                    if (result.action === 'sendError' && result.name === 'questRoom') {
                        console.log("ERROR: ", result.value);
                        this.$router.push('/');
                    }
                }
            } else {
                console.log("res: ", res);
            }
            this.loaded = true;
        });
    },
    methods: {
        reset() {
            let msg = {
                action: 'reset',
                name: 'questRoom',
                value: this.questRoomId,
            };
            this.socket.emit('fromFrontJSON', msg);
        },
        start() {
            let msg = {
                action: 'start',
                name: 'questRoom',
                value: this.questRoomId,
            };
            this.socket.emit('fromFrontJSON', msg);
        },
        winQuest(questId) {
            let msg = {
                action: 'winQuest',
                name: 'questRoom',
                value: questId,
            };
            this.socket.emit('fromFrontJSON', msg);
        },
    },
};
</script>

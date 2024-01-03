<template>
    <div>
        <v-btn @click="editModeOn">Edit mode</v-btn>
        <v-btn @click="gameModeOn">Game mode</v-btn>
        <v-container v-if="editMode">
            <v-row>
                <v-col cols="12">
                    <v-btn block @click="showCreateDialog = true">Create New Quest Room</v-btn>
                </v-col>
            </v-row>
            <v-row>
                <v-col v-for="questRoom in questRooms" :key="questRoom.id" cols="12" sm="6" md="4">
                    <v-card>
                        <v-card-title>
                            {{ questRoom.name }}
                            <v-icon @click="editQuestRoomName(questRoom)">mdi-pencil</v-icon>
                            <!-- Иконка для переименования -->
                        </v-card-title>
                        <v-card-actions>
                            <v-btn text @click="goToQuestRoom(questRoom.id)">Edit</v-btn> <!-- Переход к квест-комнате -->
                        </v-card-actions>
                    </v-card>
                </v-col>
            </v-row>

            <!-- Диалоговое окно для создания/редактирования квест-комнаты -->
            <v-dialog v-model="showCreateDialog" persistent max-width="600px">
                <v-card>
                    <v-card-title>
                        {{ editingQuestRoom ? 'Edit Quest Room' : 'New Quest Room' }}
                    </v-card-title>
                    <v-card-text>
                        <v-text-field label="Quest Room Name" v-model="questRoomName" required></v-text-field>
                    </v-card-text>
                    <v-card-actions>
                        <v-btn color="primary" @click="saveQuestRoom">Save</v-btn>
                        <v-btn color="primary" @click="showCreateDialog = false">Cancel</v-btn>
                    </v-card-actions>
                </v-card>
            </v-dialog>
        </v-container>
        <div v-if="gameMode">
            <h1>Game mode</h1>
            <div>
                <v-container>
                    <v-row>
                        <v-col cols="12">
                            <v-btn block v-if="needToSync" @click="uploadQuestRoomsToBack">Syncronize quest
                                    rooms</v-btn>
                            </v-col>
                        </v-row>
                        <v-row v-if="questRoomsFromBack.length > 0">
                                <v-col v-for="questRoom in questRoomsFromBack" :key="questRoom.id" cols="12" sm="6" md="4">
                                    <v-card>
                                        <v-card-title>
                                            {{ questRoom.name }}
                                            <v-icon color="red" v-if="!checkIfLastUpdated(questRoom)">mdi-update</v-icon>
                                            <!-- Иконка для переименования -->
                                        </v-card-title>
                                        <v-card-actions>
                                            <v-btn text @click="goToPlayQuestRoom(questRoom.id)">Play
                                                <v-icon color="green">mdi-play</v-icon>
                                            </v-btn>
                                            <!-- Переход к квест-комнате -->
                                        </v-card-actions>
                                    </v-card>
                                </v-col>
                    </v-row>
                </v-container>

            </div>
        </div>
    </div>
</template>
  
<script>
import { mapGetters } from 'vuex';
import { getDatabase, ref, set, push, child, get } from 'firebase/database';
import { socket } from '@/main';

export default {
    data() {
        return {
            questRooms: [],
            questRoomsFromBack: [],
            showCreateDialog: false,
            questRoomName: '',
            editingQuestRoom: null,
            firstLoad: true,
            editMode: false, // edit mode
            gameMode: true // game mode
        };
    },
    computed: {
        ...mapGetters(['currentUser']),
        socket() {
            return socket;
        },
        userId() {
            return this.currentUser ? this.currentUser.uid : null;
        },
        needToSync() {
            if (this.questRooms.length === 0) return false;
            if (this.questRoomsFromBack.length !== this.questRooms.length) return true;
            let needToSync = false;
            this.questRooms.forEach(questRoom => {
                //find questRoom in questRoomsFromBack by id and compare lastUpdatedAt, if not equal - return true
                let questRoomFromBack = this.questRoomsFromBack.find(questRoomFromBack => questRoomFromBack.id === questRoom.id);
                if (questRoomFromBack) {
                    if (questRoomFromBack.lastUpdatedAt !== questRoom.lastUpdatedAt) {
                        console.log('lastUpdatedAt not equal');
                        needToSync = true;
                    }
                } else {
                    console.log('questRoomFromBack not found');
                    needToSync = true;
                }
            });
            return needToSync;
        }
    },
    methods: {
        loadQuestRooms() {
            const dbRef = ref(getDatabase(), 'users/' + this.userId + '/questRooms');
            get(dbRef).then((snapshot) => {
                if (snapshot.exists()) {
                    const questRoomsData = snapshot.val();
                    this.questRooms = Object.keys(questRoomsData).map(key => {
                        return {
                            id: key,
                            ...questRoomsData[key]
                        };
                    });
                    console.log("Quest rooms loaded");
                    console.log("this.questRooms: ", this.questRooms);
                } else {
                    console.log("No quest rooms found");
                }
            }).catch((error) => {
                console.error(error);
            });
        },
        saveQuestRoom() {
            if (!this.userId) return;
            const db = getDatabase();
            const questRoomRef = ref(db, 'users/' + this.userId + '/questRooms');

            let questRoomData = {
                createdAt: Date.now(),
                ...this.editingQuestRoom,
                name: this.questRoomName,
                lastUpdatedAt: Date.now(),
                // Другие данные квест-комнаты
            };

            if (this.editingQuestRoom) {
                // Редактирование существующей квест-комнаты
                set(child(questRoomRef, this.editingQuestRoom.id), questRoomData);
            } else {
                // Добавление новой квест-комнаты
                push(questRoomRef, questRoomData);
            }

            this.showCreateDialog = false;
            this.questRoomName = '';
            this.editingQuestRoom = null;
            this.loadQuestRooms(); // Перезагрузить список квест-комнат
        },
        editQuestRoomName(questRoom) {
            this.editingQuestRoom = questRoom;
            this.questRoomName = questRoom.name;
            this.showCreateDialog = true;
        },
        goToQuestRoom(questRoomId) {
            this.$router.push('/questRoom/' + questRoomId);
        },
        goToPlayQuestRoom(questRoomId) {
            this.$router.push('/play/' + questRoomId);
        },
        gameModeOn() {
            this.gameMode = true;
            this.editMode = false;
        },
        editModeOn() {
            this.editMode = true;
            this.gameMode = false;
        },
        uploadQuestRoomsToBack() {
            this.socket.emit('fromFrontJSON', { action: "recivedFromDB", name: 'questRooms', value: this.questRooms });
        },
        checkIfLastUpdated(questRoom) {
            if (questRoom.lastUpdatedAt) {
                //find questRoom in questRooms by id and compare lastUpdatedAt, if equal - return true
                let questRoomFromFront = this.questRooms.find(questRoomFromFront => questRoomFromFront.id === questRoom.id);
                if (questRoomFromFront) {
                    if (questRoomFromFront.lastUpdatedAt === questRoom.lastUpdatedAt) {
                        return true;
                    }
                }
            }
            return false;
        }
    },
    created() {
        if (this.firstLoad) {
            // this.socket = io('http://localhost:3000');
            this.socket.emit('fromFrontString', 'firstLoad');
            this.firstLoad = false;
            this.socket.on('fromBackJSON', (message) => {
                //check if message is JSON
                let data = {};
                if (typeof message === 'string') {
                    try {
                        data = JSON.parse(message);
                    } catch (e) {
                        console.log('Получено сообщение от fromBackJSON:', message);
                    }
                } else {
                    data = message;
                }
                console.log('Получено сообщение от fromFrontString:', data);
                if (data.action === 'sendLocalData') {
                    console.log('Получено сообщение:', data);
                    if (data.name === 'questRooms') {
                        if (data.value) {
                            this.questRoomsFromBack = data.value;
                            console.log('Получено сообщение об questRooms:', this.questRoomsFromBack);
                        }
                    }
                }
            });
        }
        this.loadQuestRooms();
    },
};
</script>
  
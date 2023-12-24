<template>
    <v-container>
        <v-row>
            <v-col cols="12">
                <v-btn @click="showCreateDialog = true">Create New Quest Room</v-btn>
            </v-col>
        </v-row>
        <v-row>
            <v-col v-for="questRoom in questRooms" :key="questRoom.id" cols="12" sm="6" md="4">
                <v-card>
                    <v-card-title>
                        {{ questRoom.name }}
                        <v-icon @click="editQuestRoomName(questRoom)">mdi-pencil</v-icon> <!-- Иконка для переименования -->
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
</template>
  
<script>
import { mapGetters } from 'vuex';
import { getDatabase, ref, set, push, child, get } from 'firebase/database';

export default {
    data() {
        return {
            questRooms: [],
            showCreateDialog: false,
            questRoomName: '',
            editingQuestRoom: null
        };
    },
    computed: {
        ...mapGetters(['currentUser']),
        userId() {
            return this.currentUser ? this.currentUser.uid : null;
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
                name: this.questRoomName,
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
        }
    },
    created() {
        this.loadQuestRooms();
    }
};
</script>
  
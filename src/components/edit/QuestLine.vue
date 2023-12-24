<template>
    <div class="quest-line">
        <v-card>
            <v-card-title>{{ line.order }}. {{ line.name }}
                <v-spacer></v-spacer>
                <v-btn icon @click="folded = !folded">
                    <v-icon>{{ folded ? 'mdi-chevron-down' : 'mdi-chevron-up' }}</v-icon>
                </v-btn>
                <v-btn icon @click="infoDialog = true">
                    <v-icon>mdi-information</v-icon>
                </v-btn>
                <v-btn icon @click="openEditDialog">
                    <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn icon @click="removeDialog = true">
                    <v-icon>mdi-delete</v-icon>
                </v-btn>
            </v-card-title>
            <v-card-text v-if="!folded">
                <!-- button @click="addQuest">Добавить квест</button -->
                <v-btn block @click="openDialogToAddQuest(0, 'addQuestAndOrder')" class="ma-2">Добавить квест в
                    начало</v-btn>
                <!-- each group of quests with the same order in one line, sorted by order, -->
                <!-- with a button to add a new quest in each line and after each line -->
                <v-row v-for="group in groupedQuests" :key="group.order">
                    <v-col cols="12" class="d-flex flex-nowrap">
                        <v-btn @click="openDialogToAddQuest(group.order, 'addQuest')">+</v-btn>
                        <quest v-for="quest in group.quests" :key="quest.id" :quest="quest" :allQLs="allQLs" :QLid="line.id"
                            @deleteQuest="deleteQuest" @editQuest="editQuest" @editAndMoveQuest="editAndMoveQuest" />
                    </v-col>
                    <v-col cols="12">
                        <v-btn block @click="openDialogToAddQuest((parseInt(group.order) + 1), 'addQuestAndOrder')"
                            class="ma-2">добавить квест после {{
                                group.order }}</v-btn>
                    </v-col>
                </v-row>
            </v-card-text>
        </v-card>
        <v-dialog v-model="editDialog" persistent max-width="600px">
            <v-card>
                <v-card-title>Edit Quest Line</v-card-title>
                <v-card-text>
                    <v-text-field label="Name" v-model="editableName"></v-text-field>
                    <v-text-field label="Order" v-model="editableOrder" type="number"></v-text-field>
                </v-card-text>
                <v-card-actions>
                    <v-btn color="primary" @click="updateQuestLine">Сохранить</v-btn>
                    <v-btn color="grey" @click="editDialog = false">Отмена</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>

        <v-dialog v-model="dialogToAddQuest" persistent max-width="600px">
            <v-card>
                <v-card-title class="headline">Новая квест-линия</v-card-title>
                <v-card-text>
                    <v-container>
                        <v-row>
                            <v-col cols="12">
                                <v-text-field v-model="newQuestName" label="Имя квестa" :rules="nameRules"></v-text-field>
                            </v-col>
                        </v-row>
                    </v-container>
                </v-card-text>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="closeDialog">Отмена</v-btn>
                    <v-btn color="blue darken-1" text @click="confirmAddQuestLine">Создать</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <v-dialog v-model="removeDialog" persistent max-width="600px">
            <v-card>
                <v-card-title class="headline">Удалить квест-линию?</v-card-title>
                <v-card-actions>
                    <v-spacer></v-spacer>
                    <v-btn color="blue darken-1" text @click="removeDialog = false">Отмена</v-btn>
                    <v-btn color="blue darken-1" text @click="$emit('removeQuestLine', line.id)">Удалить</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
        <!-- диалоговое окно с полной информацией -->
        <v-dialog v-model="infoDialog" max-width="600px">
            <v-card>
                <v-card-title>{{ line.name }}</v-card-title>
                <v-card-text>
                    <!-- list of all info about the quest -->
                    <v-list>
                        <v-list-item>
                            <v-list-item-content>
                                <v-list-item-title>Order: {{ line.order }}</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item>
                            <v-list-item-content>
                                <v-list-item-title>Created At: {{ formatDate(line.createdAt) }}</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item>
                            <v-list-item-content>
                                <v-list-item-title>Last Updated At: {{ formatDate(line.lastUpdatedAt) }}</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item>
                            <v-list-item-content>
                                <v-list-item-title>Number of Quests: {{ questsAmount }}</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                        <v-list-item>
                            <v-list-item-content>
                                <v-list-item-title>id: {{ line.id }}</v-list-item-title>
                            </v-list-item-content>
                        </v-list-item>
                    </v-list>
                </v-card-text>
                <v-card-actions>
                    <v-btn color="primary" @click="infoDialog = false">Close</v-btn>
                </v-card-actions>
            </v-card>
        </v-dialog>
    </div>
</template>
  
<script>
import Quest from './Quest.vue';
import fire from '@/main';

export default {
    components: {
        Quest
    },
    props: {
        line: Object,
        questRoomId: String,
        userId: String,
        allQLs: Array,
        forceUpdateInnerQuestLines: Boolean, // if true, force update inner quest lines
    },
    data() {
        return {
            Quests: {},
            editDialog: false,
            editableName: this.line.name,
            editableOrder: this.line.order,
            firstLoad: true,
            dialogToAddQuest: false,
            newQuestName: '',
            nameRules: [
                (v) => !!v || 'Имя квеста должно быть заполнено',
                (v) => v.length <= 20 || 'Имя квеста не должно превышать 20 символов'
            ],
            currentOrderForNewQuest: 0,
            actionType: '', // 'addQuest' or 'addQuestAndOrder'
            removeDialog: false,
            infoDialog: false,
            folded: true, // if true, fold the quest line
        };
    },
    computed: {
        groupedQuests() {
            //if this.Quests is empty object, return empty array
            if (typeof this.Quests === 'object' && Object.keys(this.Quests).length === 0) {
                return [];
            }
            if (!this.Quests || this.Quests.length === 0) {
                return [];
            }
            // retern an array of arrays of quests, grouped by quest.order
            const grouped = this.Quests.reduce((groups, quest) => {
                const order = quest.order;
                if (!groups[order]) {
                    groups[order] = [];
                }
                groups[order].push(quest);
                return groups;
            }, {});
            // convert object to array
            const groupedArray = Object.keys(grouped).map((order) => {
                return {
                    order,
                    quests: grouped[order]
                };
            });
            // sort by order
            groupedArray.sort((a, b) => a.order - b.order);
            return groupedArray;
        },
        questsAmount() {
            if (!this.line.quests || this.line.quests === '') {
                return '0';
            }
            return this.Quests.length;
        }
    },
    async created() {
        // console.log("this.line: ", this.line.id);
        // console.log("this.questRoomId: ", this.questRoomId);
        // console.log("this.userId: ", this.userId);
        await this.loadQuests();
    },
    methods: {
        async loadQuests() {
            // удаляем старые записи
            this.Quests = {};
            const db = fire.database();
            const questsRef = db.ref(`users/${this.userId}/questRooms/${this.questRoomId}/questLines/${this.line.id}/quests`);
            questsRef.on('value', (snapshot) => {
                if (snapshot.exists()) {
                    const questsData = snapshot.val();
                    this.Quests = Object.keys(questsData).map(key => {
                        return {
                            id: key,
                            ...questsData[key]
                        };
                    });
                    if (this.firstLoad) {
                        this.checkAndFixOrder();
                        this.firstLoad = false;
                    }
                    console.log(`this.Quests in ${this.line.name}: `, this.Quests);
                }
            });
        },
        removeQuestLine(id) {
            this.$emit('removeQuestLine', id);
        },
        openEditDialog() {
            this.editDialog = true;
        },
        updateQuestLine() {
            this.$emit('updateQuestLine', {
                lastUpdatedAt: Date.now(),
                id: this.line.id,
                name: this.editableName,
                order: this.editableOrder
            });
            this.editDialog = false;
        },
        async addQuest(order) {
            const db = fire.database();
            const questRef = db.ref(`users/${this.userId}/questRooms/${this.questRoomId}/questLines/${this.line.id}/quests`).push();
            const questId = questRef.key;
            const quest = {
                id: questId,
                name: this.newQuestName,
                order: order,
                createdAt: Date.now(),
                lastUpdatedAt: Date.now()
            };
            await questRef.set(quest);
        },
        async addQuestAndOrder(order) {
            //first, chech if there are quests with order >= order
            if (this.Quests.length > 0) {
                let moreQuestsExist = false;
                for (let i = 0; i < this.Quests.length; i++) {
                    if (this.Quests[i].order >= order) {
                        moreQuestsExist = true;
                        break;
                    }
                }
                //if so, increase their order by 1
                if (moreQuestsExist) {
                    //if so, increase their order by 1
                    for (let i = 0; i < this.Quests.length; i++) {
                        if (this.Quests[i].order >= order) {
                            this.Quests[i].order++;
                        }
                    }
                    //update db
                    console.log("this.Quests before updateQuests: ", this.Quests);
                    await this.updateQuests();
                }
            }
            this.firstLoad = true;
            this.addQuest(order);
        },
        async updateQuests() {
            //first, convert Quests to an object with keys = quest ids
            let questsObject = {};
            for (let i = 0; i < this.Quests.length; i++) {
                questsObject[this.Quests[i].id] = this.Quests[i];
            }
            const db = fire.database();
            const questsRef = db.ref(`users/${this.userId}/questRooms/${this.questRoomId}/questLines/${this.line.id}/quests`);
            await questsRef.set(questsObject);
        },
        async checkAndFixOrder() {
            // console.log("checkAndFixOrder");
            //first, sort quests by order
            this.Quests.sort((a, b) => a.order - b.order);
            //check if there any gaps in order
            let gapsExist = false; //assume there are no gaps
            // проверяем что первый квест имеет order = 0, если нет, то есть пропуски и нужно все квесты сдвинуть на значение пропуска
            if (this.Quests.length > 0) {
                if (this.Quests[0].order !== 0) {
                    gapsExist = true;
                    let gapSize = this.Quests[0].order;
                    for (let i = 0; i < this.Quests.length; i++) {
                        this.Quests[i].order -= gapSize;
                    }
                }
            }
            let currentLowestOrder = 0;
            if (this.Quests.length > 0) {
                for (let i = 0; i < this.Quests.length; i++) {
                    if (this.Quests[i].order > currentLowestOrder) {
                        if (this.Quests[i].order > currentLowestOrder + 1) {
                            gapsExist = true;
                            let gapSize = this.Quests[i].order - currentLowestOrder;
                            for (let j = 0; j < this.Quests.length; j++) {
                                if (this.Quests[j].order > currentLowestOrder) {
                                    this.Quests[j].order -= (gapSize - 1);
                                }
                            }
                        }
                        currentLowestOrder = this.Quests[i].order;
                    }
                }
            }
            if (gapsExist) {
                await this.updateQuests();
            }
        },
        async confirmAddQuestLine() {
            //first, chech if newQuestName is not empty
            if (!this.newQuestName || this.newQuestName === '') {
                return;
            }
            // select the action type
            console.log("new order will be: ", this.currentOrderForNewQuest);
            console.log("action type: ", this.actionType);
            if (this.actionType === 'addQuest') {
                await this.addQuest(this.currentOrderForNewQuest);
            } else if (this.actionType === 'addQuestAndOrder') {
                await this.addQuestAndOrder(this.currentOrderForNewQuest);
            }
            this.newQuestName = '';
            this.dialogToAddQuest = false;
        },
        closeDialog() {
            this.newQuestName = '';
            this.dialogToAddQuest = false;
        },
        openDialogToAddQuest(order, action) {
            console.log("new order will be: ", order);
            this.currentOrderForNewQuest = order;
            this.actionType = action;
            this.dialogToAddQuest = true;
        },
        deleteQuest(id) {
            // delete quest from db, before deliting, put firstLoad to true
            this.firstLoad = true;
            const db = fire.database();
            const questRef = db.ref(`users/${this.userId}/questRooms/${this.questRoomId}/questLines/${this.line.id}/quests/${id}`);
            questRef.remove();
        },
        editQuest(id, quest) {
            // update quest in db, before updating, put firstLoad to true
            this.firstLoad = true;
            const db = fire.database();
            const questRef = db.ref(`users/${this.userId}/questRooms/${this.questRoomId}/questLines/${this.line.id}/quests/${id}`);
            questRef.update(quest);
        },
        async editAndMoveQuest(id, quest, newQLid) {
            console.log("editAndMoveQuest");
            console.log("id: ", id);
            console.log("quest: ", quest);
            console.log("newQLid: ", newQLid);
            this.firstLoad = true;
            // delete quest from this line
            const db = fire.database();
            const questRef = db.ref(`users/${this.userId}/questRooms/${this.questRoomId}/questLines/${this.line.id}/quests/${id}`);
            await questRef.remove();
            // update quest in db, before updating, put firstLoad to true
            // add quest to new line keeping the same id as a key
            const newQuestRef = db.ref(`users/${this.userId}/questRooms/${this.questRoomId}/questLines/${newQLid}/quests/${id}`);
            await newQuestRef.set(quest);
            await this.loadQuests();
            this.$emit('refreshQuestLines');

        },
        formatDate(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleString();
        }
    },
    watch: {
        forceUpdateInnerQuestLines() {
            console.log("forceUpdateInnerQuestLines");
            this.firstLoad = true;
            this.loadQuests();
        }
    }
};
</script>
<style scoped>
/* Стили для отображения квест-линий в одной строке */
.quest {
    /* Квест-линии будут занимать доступное пространство равномерно */
    flex: 1;
    /* Обеспечивает перенос текста внутри flex элементов, если не хватает места */
    min-width: 0;
    /* Добавляем отступы между квест-линиями */
    margin: 0 8px;
}
</style>
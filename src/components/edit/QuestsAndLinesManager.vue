<template>
  <div>
    <v-container v-if="loaded">
      <!-- Если еще нет квест-линий, показываем одну большую кнопку добавления -->
      <div v-if="questLines.length === 0" class="text-center">
        <!--the button width is 100vw -->
        <v-btn large block @click="openAddQuestLineDialog(0, 'addAndOrder')">Добавить квест-линию</v-btn>
      </div>

      <template v-else>
        <!-- Кнопка добавления новой квест-линии в начале -->
        <v-row justify="center">
          <v-btn block @click="openAddQuestLineDialog(0, 'addAndOrder')" class="ma-2">Добавить в начало</v-btn>
        </v-row>

        <v-row v-for="(group, order) in groupedQuestLines" :key="order">
          <!-- Строка с квест-линиями одинакового ордера -->
          <v-col cols="12" v-if="questLines" class="d-flex flex-nowrap">
            <!-- Кнопка добавления новой квест-линии с тем же ордером -->
            <v-btn @click="openAddQuestLineDialog(order, 'addToOrder')" class="ma-2">+</v-btn>

            <!-- Отображение квест-линий -->
            <quest-line v-for="line in group" :key="line.id" :line="line" :userId="userId" :questRoomId="questRoomId"
              @edit-quest="editQuest" @remove-quest="removeQuest" @removeQuestLine="removeQuestLine"
              @updateQuestLine="updateQuestLine" @refreshQuestLines="refreshQuestLines" :allQLs="questLines"
              :forceUpdateInnerQuestLines="forceUpdateInnerQuestLines" :forceUnfoldAll="forceUnfoldAll"></quest-line>
          </v-col>

          <!-- Кнопка добавления новой квест-линии между группами -->
          <v-col cols="12" class="text-center">
            <v-btn block v-if="isNotLastGroup(order)"
              @click="openAddQuestLineDialog((parseInt(order) + 1), 'addAndOrder')" class="ma-2">
              Добавить после {{ order }}
            </v-btn>
          </v-col>
        </v-row>

        <!-- Кнопка добавления новой квест-линии в конце -->
        <v-row justify="center">
          <v-btn block @click="openAddQuestLineDialog((largestOrder + 1), 'addAndOrder')" class="ma-2">Добавить в
            конец</v-btn>
        </v-row>
      </template>
    </v-container>
    <v-dialog v-model="dialog" persistent max-width="600px">
      <v-card>
        <v-card-title class="headline">Новая квест-линия</v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-text-field v-model="newQuestLineName" label="Имя квест-линии" :rules="nameRules"></v-text-field>
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
  </div>
</template>

<script>
import { fire } from '@/main';
import QuestLine from './QuestLine.vue';
export default {
  props: {
    questRoomId: String,
    userId: String,
    forceUnfoldAll: Boolean
  },
  data() {
    return {
      loaded: false,
      firstLoad: true,
      questLines: {}, // Обьект для хранения квест-линий
      dialog: false,
      newQuestLineName: '',
      nameRules: [
        v => !!v || 'Имя квест-линии обязательно',
        v => (v && v.length <= 20) || 'Имя квест-линии не должно быть больше 20 символов'
      ],
      currentOrderForNewLine: 0,
      actionType: null, // 'addAndOrder' или 'addToOrder'
      forceUpdateInnerQuestLines: false, //переменная для принудительного обновления квест-линий внутри компонента
    };
  },
  components: {
    QuestLine
  },
  computed: {
    groupedQuestLines() {
      // Группировка квест-линий по ордеру
      if (!this.questLines) {
        return [];
      }
      return Object.values(this.questLines).reduce((acc, line) => {
        if (!acc[line.order]) {
          acc[line.order] = [];
        }
        acc[line.order].push(line);
        return acc;
      }, {});
    },
    largestOrder() {
      // Поиск максимального ордера
      if (!this.questLines) {
        return 0;
      }
      return Math.max(...Object.values(this.questLines).map(line => line.order));

    }
  },
  async created() {
    // Получение квест-линий из Firebase
    // Подробности будут реализованы здесь
    await this.loadQuestLines();

    this.loaded = true;
  },
  methods: {
    async addQuestLineToOrder(order) {
      // Добавление новой квест-линии в указанный ордер
      let line = {
        name: this.newQuestLineName,
        //convert order to number
        order: +order,
        createdAt: Date.now(),
        lastUpdatedAt: Date.now(),
        quests: []
      };
      // Добавляем квест-линию в базу данных
      this.loaded = false;
      const db = fire.database();
      const questLinesRef = db.ref(`users/${this.userId}/questRooms/${this.questRoomId}/questLines`);
      const newLineRef = questLinesRef.push();
      await newLineRef.set(line);
      this.checkAndFixOrder() //проверяем и исправляем ордера
      //update questRoom lastUpdatedAt
      const questRoomRef = db.ref(`users/${this.userId}/questRooms/${this.questRoomId}`);
      await questRoomRef.update({
        lastUpdatedAt: Date.now()
      });
      this.loaded = true;
    },
    /*
    принимает ордер, добавляет квест-линию с этим ордером, предварительно увеличивая ордер у всех квест-линий, 
    начиная с этого ордера
    -*/
    async addQuestLineAndOrder(order) {
      // проверяем, есть ли уже квест-линия с таким ордером или больше
      let isOrderOrBiggerExists = false; //по умолчанию нет
      if (this.questLines.length > 0) { //если есть квест-линии
        this.questLines.forEach((line) => {
          if (line.order >= order) {
            isOrderOrBiggerExists = true;
          }
        });
        //если да, то увеличиваем ордер у всех квест-линий, начиная с этого ордера
        if (isOrderOrBiggerExists) {
          this.questLines.forEach((line) => {
            if (line.order >= order) {
              line.order++;
            }
          });
        }
        //обновляем бд
        await this.updateQuestLines(); //await - ждем, пока обновится бд
      }
      //добавляем новую линию
      this.firstLoad = true;
      await this.addQuestLineToOrder(order); //вызываем метод, который добавляет новую линию

    },
    isNotLastGroup(order) {
      // Проверка, не последняя ли группа по ордеру
      const maxOrder = Math.max(...this.questLines.map(line => line.order));
      return order < maxOrder;
    },
    async removeQuestLine(id) {
      // Удаление квест-линии
      this.loaded = false;
      this.firstLoad = true;
      const db = fire.database();
      const questLinesRef = db.ref(`users/${this.userId}/questRooms/${this.questRoomId}/questLines`);
      const lineRef = questLinesRef.child(id);
      await lineRef.remove();
      //update questRoom lastUpdatedAt
      const questRoomRef = db.ref(`users/${this.userId}/questRooms/${this.questRoomId}`);
      await questRoomRef.update({
        lastUpdatedAt: Date.now()
      });
      this.loaded = true;
    },
    async updateQuestLine(line) {
      // Обновление квест-линии
      this.loaded = false;
      this.firstLoad = true;
      const db = fire.database();
      const questLinesRef = db.ref(`users/${this.userId}/questRooms/${this.questRoomId}/questLines`);
      const lineRef = questLinesRef.child(line.id);
      await lineRef.update({
        name: line.name,
        order: line.order,
        lastUpdatedAt: Date.now()
      });
      //update questRoom lastUpdatedAt
      const questRoomRef = db.ref(`users/${this.userId}/questRooms/${this.questRoomId}`);
      await questRoomRef.update({
        lastUpdatedAt: Date.now()
      });
      this.loaded = true;
    },
    addQuest() {
      //тут будет метод добавления квеста
    },
    editQuest() {
      // тут будет метод редактирования квеста
    },
    removeQuest() {
      //тут будет метод удаления квеста
    },
    /*
    метод загружает квест-линии из бд
    -*/
    async loadQuestLines() {
      this.questLines = {};
      let self = this;
      const db = fire.database();
      const questLinesRef = db.ref(`users/${self.userId}/questRooms/${self.questRoomId}/questLines`);
      questLinesRef.on('value', (snapshot) => {
        const result = snapshot.val();
        if (!result) {
          self.questLines = {};
          return;
        }
        //преобразуем обьект в массив и добавляем id
        self.questLines = Object.keys(result).map(key => {
          result[key].id = key;
          return result[key];
        });
        //если это первая загрузка, то проверяем и исправляем ордера
        if (self.firstLoad) {
          self.firstLoad = false;
          self.checkAndFixOrder();
        }
        self.loaded = true;
        console.log("self.questLines: ", self.questLines);
      });
    },
    /*
    обновляет бд
    -*/
    async updateQuestLines() {
      this.loaded = false;
      console.log("this.questLines: ", this.questLines);
      //преобразуем массив в обьект с ключами из id, и удаляем id
      let questLines = {};
      this.questLines.forEach((line) => {
        questLines[line.id] = line;
        delete questLines[line.id].id;
      });
      const db = fire.database();
      const questLinesRef = db.ref(`users/${this.userId}/questRooms/${this.questRoomId}/questLines`);
      await questLinesRef.set(questLines);
      this.loaded = true;
    },
    /*
    метод проверяет что все квест-линии имеют непрерывные ордера без пропусков и исправляет пропуски
    если они есть, то нужно сдвинуть все квест-линии, начиная с пропущенного ордера
    несколько линий могут иметь одинаковый ордер, но следующий по номеналу ордер должен быть на 1 больше
    -*/
    async checkAndFixOrder() {
      // console.log("checkAndFixOrder:");
      // console.log("this.questLines: ", this.questLines);
      //для начала сортируем квест-линии по ордеру
      this.questLines.sort((a, b) => {
        return a.order - b.order;
      });
      //проверяем, есть ли пропуски в ордерах
      let startFromZero = true; //по умолчанию да
      //проверяем, если первая линия имеет ордер не 0, то берем ее ордер, и корректируем все ордера на минус этот ордер
      if (this.questLines[0].order > 0) {
        startFromZero = false;
        let difference = this.questLines[0].order;
        this.questLines.forEach((line) => {
          line.order -= difference;
        });
      }
      let needToUpdate = false; //по умолчанию нет
      if (!startFromZero) {
        console.log("NOT START FROM ZERO!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!");
        console.log("this.questLines: ", this.questLines);
        needToUpdate = true;
      }
      //если все линии начинаются с 0, то проверяем, есть ли пропуски

      let currentLowestOrder = 0; //текущий наименьший ордер
      if (this.questLines.length > 0) { //если есть квест-линии
        this.questLines.forEach((line) => {
          if (line.order > currentLowestOrder) {
            if (line.order - currentLowestOrder > 1) {
              needToUpdate = true;
              let difference = line.order - currentLowestOrder;
              //если есть пропуск, то сдвигаем все квест-линии, начиная с пропущенного ордера
              this.questLines.forEach((line) => {
                if (line.order > currentLowestOrder) {
                  line.order -= (difference - 1);
                }
              });

            }
            currentLowestOrder = line.order;
          }
        });
        if (needToUpdate) {
          //обновляем бд
          await this.updateQuestLines(); //await - ждем, пока обновится бд
        }

      }
    },
    openAddQuestLineDialog(order, actionType) {
      this.currentOrderForNewLine = order;
      this.newQuestLineName = '';
      this.dialog = true;
      this.actionType = actionType; // 'addAndOrder' или 'addToOrder'
    },
    closeDialog() {
      this.dialog = false;
      this.newQuestLineName = ''; // Сбрасываем имя для следующего использования диалога
    },
    async confirmAddQuestLine() {
      if (this.newQuestLineName) {
        if (this.actionType === 'addAndOrder') {
          await this.addQuestLineAndOrder(this.currentOrderForNewLine);
        } else if (this.actionType === 'addToOrder') {
          await this.addQuestLineToOrder(this.currentOrderForNewLine);
        }
        this.dialog = false; // Закрыть диалог
        this.actionType = null; // Сбросить тип действия после выполнения
        this.newQuestLineName = ''; // Сбрасываем имя для следующего использования диалога
      }
    },
    async refreshQuestLines() {
      this.forceUpdateInnerQuestLines = !this.forceUpdateInnerQuestLines;
      console.log("refreshQuestLines FINISHED!!!!!!!!!!!!!!!!!!!!!!!!!!");
    }
  }
};
</script>

<style scoped>
/* Стили для отображения квест-линий в одной строке */
.quest-line {
  /* Квест-линии будут занимать доступное пространство равномерно */
  flex: 1;
  /* Обеспечивает перенос текста внутри flex элементов, если не хватает места */
  min-width: 0;
  /* Добавляем отступы между квест-линиями */
  margin: 0 8px;
}
</style>
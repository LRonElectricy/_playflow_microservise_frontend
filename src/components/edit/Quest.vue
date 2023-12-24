<template>
  <div class="quest">
    <v-card>
      <v-card-title>
        {{ quest.order }}.
        {{ quest.name }}
        <v-spacer></v-spacer>
        <v-btn @click="infiDialog = true" icon>
          <v-icon>mdi-information</v-icon>
        </v-btn>
        <v-btn @click="editDialog = true" icon>
          <v-icon>mdi-pencil</v-icon>
        </v-btn>
        <v-btn @click="removeDialog = true" icon>
          <v-icon>mdi-delete</v-icon>
        </v-btn>
      </v-card-title>
    </v-card>
    <!-- Диалоговое окно для подтверждения удаления -->
    <v-dialog v-model="removeDialog" max-width="600px">
      <v-card>
        <v-card-title>Are you sure?</v-card-title>
        <v-card-actions>
          <v-btn color="primary" @click="removeDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="deleteQuest">Delete</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- Диалоговое окно для редактирования имя и ордера -->
    <v-dialog v-model="editDialog" max-width="600px">
      <v-card>
        <v-card-title>Edit Quest</v-card-title>
        <v-card-text>
          <v-text-field label="Quest Name" v-model="editableName" required></v-text-field>
          <v-text-field type="number" label="Quest Order" v-model="editableOrder" required></v-text-field>
          <v-select :items="allQLs" label="Quest Line" :value="QLid" item-text="name" item-value="id" return-object
            required @change="changeQL($event)">
          </v-select>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="editDialog = false">Cancel</v-btn>
          <v-btn color="primary" @click="editQuest">Save</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <!-- диалоговое окно с полной информацией -->
    <v-dialog v-model="infiDialog" max-width="600px">
      <v-card>
        <v-card-title>{{ quest.name }}</v-card-title>
        <v-card-text>
          <!-- list of all info about the quest -->
          <v-list>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>Order: {{ quest.order }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>Created At: {{ formatDate(quest.createdAt) }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>Last Updated At: {{ formatDate(quest.lastUpdatedAt) }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>
                  Quest Line: {{ getCurrentQL().name }}
                </v-list-item-title>
              </v-list-item-content>
            </v-list-item>
            <v-list-item>
              <v-list-item-content>
                <v-list-item-title>id: {{ quest.id }}</v-list-item-title>
              </v-list-item-content>
            </v-list-item>
          </v-list>
        </v-card-text>
        <v-card-actions>
          <v-btn color="primary" @click="infiDialog = false">Close</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </div>
  <!-- Действия для управления квестом -->
</template>
  
<script>
export default {
  props: {
    quest: Object,
    allQLs: Array,
    QLid: String
  },
  data() {
    return {
      removeDialog: false,
      editDialog: false,
      infiDialog: false,
      editableName: this.quest.name,
      editableOrder: this.quest.order,
      newQLid: this.QLid
    };
  },
  created() {
    console.log("this.quest: ", this.quest);
    console.log("this.allQLs: ", this.allQLs);
    console.log("this.QLid: ", this.QLid);
  },
  methods: {
    editQuest() {
      let quest = {
        ...this.quest,
        name: this.editableName,
        order: parseInt(this.editableOrder),
        lastUpdatedAt: Date.now()
      };
      if (this.newQLid !== this.QLid) {
        this.$emit('editAndMoveQuest', this.quest.id, quest, this.newQLid);
      } else {
        this.$emit('editQuest', this.quest.id, quest);
      }
      this.editDialog = false;
    },
    deleteQuest() {
      this.$emit('deleteQuest', this.quest.id);
      this.removeDialog = false;
    },
    formatDate(date) {
      return new Date(date).toLocaleString();
    },
    getCurrentQL() {
      return this.allQLs.find(ql => ql.id === this.QLid);
    },
    changeQL(ql) {
      console.log("changeQL: ", ql);
      this.newQLid = ql.id;
      // this.$emit('changeQL', this.quest.id, ql.id);
    }
  }
};
</script>
  
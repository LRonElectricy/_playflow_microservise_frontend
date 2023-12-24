<template>
    <v-container>
      <v-row justify="center">
        <v-col cols="12" sm="8" md="4">
          <v-card>
            <v-card-title>
              {{ isSignUp ? 'Register' : 'Sign In' }}
            </v-card-title>
            <v-card-text>
              <v-form @submit.prevent="isSignUp ? signUp() : signIn()">
                <v-text-field
                  v-model="email"
                  label="Email"
                  type="email"
                  required
                ></v-text-field>
                <v-text-field
                  v-model="password"
                  :type="showPassword ? 'text' : 'password'"
                  label="Password"
                  required
                  :append-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                  @click:append="togglePasswordVisibility"
                ></v-text-field>
                <v-text-field
                  v-if="isSignUp"
                  v-model="name"
                  label="Full Name"
                  required
                ></v-text-field>
                <v-btn type="submit" color="primary">
                  {{ isSignUp ? 'Register' : 'Sign In' }}
                </v-btn>
              </v-form>
            </v-card-text>
            <v-card-actions>
              <v-btn text @click="toggleSignUp">
                {{ isSignUp ? 'Already have an account?' : 'Create an account' }}
              </v-btn>
            </v-card-actions>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </template>
  
  <script>
  import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
  import { getDatabase, ref, set } from 'firebase/database';
  
  export default {
    data() {
      return {
        email: '',
        password: '',
        name: '',
        isSignUp: false,
        showPassword: false
      };
    },
    methods: {
      toggleSignUp() {
        this.isSignUp = !this.isSignUp;
      },
      signIn() {
        const auth = getAuth();
        signInWithEmailAndPassword(auth, this.email, this.password)
          .then(() => {
            // User successfully signed in
            // Redirect or manage the session here
          })
          .catch((error) => {
            console.error('Sign in failed:', error);
          });
      },
      signUp() {
        const auth = getAuth();
        createUserWithEmailAndPassword(auth, this.email, this.password)
          .then(() => {
            return this.createUserRecord(auth.currentUser);
          })
          .then(() => {
            // User record created in the database
            // Redirect or manage the session here
          })
          .catch((error) => {
            console.error('Registration failed:', error);
          });
      },
      createUserRecord(user) {
        const db = getDatabase();
        return set(ref(db, 'users/' + user.uid), {
          name: this.name,
          email: this.email
        });
      },
      togglePasswordVisibility() {
        this.showPassword = !this.showPassword;
      }
    }
  };
  </script>
  
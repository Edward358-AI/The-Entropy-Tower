import { defineStore } from 'pinia'
import { ref } from 'vue'
import { auth } from '../services/firebase'
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const loading = ref(true)
  const error = ref(null)

  const initAuth = () => {
    return new Promise((resolve) => {
      onAuthStateChanged(auth, (currentUser) => {
        user.value = currentUser
        loading.value = false
        resolve(currentUser)
      })
    })
  }

  const signUp = async (email, password) => {
    loading.value = true
    error.value = null
    try {
      await createUserWithEmailAndPassword(auth, email, password)
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  const signIn = async (email, password) => {
    loading.value = true
    error.value = null
    try {
      await signInWithEmailAndPassword(auth, email, password)
    } catch (e) {
      error.value = e.message
      throw e
    } finally {
      loading.value = false
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
      user.value = null
    } catch (e) {
      error.value = e.message
    }
  }

  return {
    user,
    loading,
    error,
    initAuth,
    signUp,
    signIn,
    signOut
  }
})

import { initializeApp, getApps } from 'firebase/app'
// import { getAnalytics } from 'firebase/analytics'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
    apiKey: 'AIzaSyDBro1P_0AaD9KYK2ERLSCIifLujLrm39Y',
    authDomain: 'mlmh-17c76.firebaseapp.com',
    projectId: 'mlmh-17c76',
    storageBucket: 'mlmh-17c76.firebasestorage.app',
    messagingSenderId: '578629102626',
    appId: '1:578629102626:web:30e132199459833d69ee7b',
    measurementId: 'G-8WR4Y33LSV',
}

// Initialize Firebase
const app =
    getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
// const analytics = getAnalytics(app)
const auth = getAuth(app)

// export { app, auth, analytics }
export { app, auth }

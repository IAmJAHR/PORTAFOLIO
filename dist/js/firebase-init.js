const firebaseConfig = {
  apiKey: "AIzaSyCIXTEfM_DlGkTAUen1lP5rT0EjTSQ",
  authDomain: "portafolio-27fdf.firebaseapp.com",
  projectId: "portafolio-27fdf",
  storageBucket: "portafolio-27fdf.appspot.com",
  messagingSenderId: "126758793135",
  appId: "1:126758793135:web:b493f24a35ed8f8b08d0fe",
  measurementId: "G-HTN1B1H9H"
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
  console.log("✅ Firebase inicializado");
}

var db = firebase.firestore(); // exportable global

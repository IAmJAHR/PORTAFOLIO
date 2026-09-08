const firebaseConfig = {
  apiKey: "AIzaSyClKTEM_F0FN_D1GkTAUenl1P5rT0EJTsQ",
  authDomain: "portafolio-27fdf.firebaseapp.com",
  projectId: "portafolio-27fdf",
  storageBucket: "portafolio-27fdf.firebasestorage.app",
  messagingSenderId: "267587931355",
  appId: "1:267587931355:web:b403f24a35ed8f8b08d0fe",
  measurementId: "G-HTN11B1H9H"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

window.saveScoreToFirebase = function(nombre, score) {
    return db.collection("puntaje").add({
        usuaroip: nombre,
        puntaje: score,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

// Remove the old global guardarPuntajeArcade
window.mostrarPuntajes = function() {
    const tbody = document.querySelector("#leaderboard-table tbody");
    if (!tbody) return;
    tbody.innerHTML = "<tr><td colspan='3'>Cargando...</td></tr>"; 

    db.collection("puntaje").orderBy("puntaje", "desc").limit(10).get()
    .then((querySnapshot) => {
        tbody.innerHTML = "";
        let index = 0;
        querySnapshot.forEach((doc) => {
            const record = doc.data();
            const fila = document.createElement("tr");
            fila.innerHTML = `
                <td>${index + 1}</td>
                <td>${record.usuaroip || record.usuario || 'Anónimo'}</td>
                <td>${record.puntaje || 0}</td>
            `;
            tbody.appendChild(fila);
            index++;
        });
    })
    .catch((error) => {
        console.error("❌ Error al mostrar puntajes:", error);
        tbody.innerHTML = "<tr><td colspan='3'>Error al cargar</td></tr>";
    });
}

document.addEventListener("DOMContentLoaded", () => {
    mostrarPuntajes();
});

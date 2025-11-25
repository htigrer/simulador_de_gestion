import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  onAuthStateChanged
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAs_LBouq2njfy0cJHJjuiUfASC3RqVKkM",
  authDomain: "practicas-comunitario.firebaseapp.com",
  projectId: "practicas-comunitario",
  storageBucket: "practicas-comunitario.firebasestorage.app",
  messagingSenderId: "874017448238",
  appId: "1:874017448238:web:03928054e98441838d1abf"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 📌 Lista de correos permitidos
const correosPermitidos = [
  "dpachecog2@unemi.edu.ec", 
  "cnavarretem4@unemi.edu.ec",
  "htigrer@unemi.edu.ec",
  "gorellanas2@unemi.edu.ec",
  "iastudillol@unemi.edu.ec",
  "sgavilanezp2@unemi.edu.ec",
  "jzamoram9@unemi.edu.ec",
  "fcarrillop@unemi.edu.ec",
  "naguilarb@unemi.edu.ec",
  "ehidalgoc4@unemi.edu.ec",
  "lbrionesg3@unemi.edu.ec",
  "xsalvadorv@unemi.edu.ec",
  "nbravop4@unemi.edu.ec",
  "jmoreirap6@unemi.edu.ec",
  "kholguinb2@unemi.edu.ec"
];

// Proveedor de Google
const provider = new GoogleAuthProvider();

// Función para inicializar el botón de login
function inicializarLogin() {
  const loginBtn = document.getElementById("loginBtn");
  
  if (!loginBtn) {
    console.error("Error: No se encontró el botón de login con id 'loginBtn'");
    return;
  }
  
  loginBtn.addEventListener("click", () => {
    loginBtn.disabled = true;

    signInWithPopup(auth, provider)
      .then(result => {
        console.log("Usuario autenticado:", result.user);
        alert(`Bienvenido ${result.user.displayName}`);
      })
      .catch(error => {
        console.error("Error login:", error);
        alert(`Error al iniciar sesión: ${error.message}`);
        loginBtn.disabled = false;
      });
  });
}

// 🔐 Validar si el usuario logueado está permitido
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (!correosPermitidos.includes(user.email)) {
      alert("Tu cuenta no está autorizada.");
      auth.signOut();
      window.location.href = "index.html";
      return;
    }

    // ✔️ Si el correo es válido, ahora sí redirigir
    window.location.href = "preguntas.html";
  }
});

// Verificar si el DOM ya está cargado o esperar a que se cargue
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", inicializarLogin);
} else {
  inicializarLogin();
}

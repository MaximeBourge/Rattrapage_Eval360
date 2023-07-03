import { Component, OnInit } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';


@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {

  confirmPassword: string = "";
  registrationSuccess: boolean = false; // Variable pour suivre l'état de l'enregistrement
  signupError: string = ""; // Propriété pour stocker le message d'erreur

  constructor(private router: Router) {}

  ngOnInit() {
    firebase.initializeApp(environment.firebaseConfig);
  }

  signUp(username: string, email: string, password: string) {
    // Vérification des mots de passe correspondants
    if (password !== this.confirmPassword) {
      alert("Les mots de passe ne correspondent pas.");
      return;
    }

    // Vérification de la force du mot de passe
    if (!this.isStrongPassword(password)) {
      alert("Le mot de passe doit contenir au moins 8 caractères, incluant au moins une lettre minuscule, une lettre majuscule et un chiffre.");
      return;
    }

    // Création de l'utilisateur dans Firebase Authentication
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        const userId = user!.uid;

        // Création de l'utilisateur dans la base de données
        const db = firebase.database();
        const usersRef = db.ref('users');

        // Vérification de l'existence du compte
        usersRef.orderByChild('email').equalTo(email).once('value', (snapshot) => {
          if (snapshot.exists()) {

          } else {
            usersRef.child(userId).set({
              id: userId,
              username: username,
              email: email,
              password: password
            })
            .then(() => {
              console.log("Utilisateur enregistré avec succès !");
              // Effectuer d'autres actions ou afficher un message de confirmation
            })
            .catch((error) => {
              console.error("Erreur lors de l'enregistrement de l'utilisateur :", error);
              // Gérer l'erreur d'enregistrement de l'utilisateur
            });
          }
        });
      })
      .catch((error) => {
        console.error("Erreur lors de la création de l'utilisateur :", error);
        this.signupError = `L'adresse email: <u>${email}</u> a déjà été attribuée.`;
      });
  }

  isStrongPassword(password: string): boolean {
    const regex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[a-zA-Z\d@$!%*?&]{8,}$/;
    return regex.test(password);
  }

  redirectToLogin() {
    // Effectuer la redirection vers la page de connexion
    // Vous devez importer Router depuis @angular/router
    this.router.navigate(['/login']);
  }
}

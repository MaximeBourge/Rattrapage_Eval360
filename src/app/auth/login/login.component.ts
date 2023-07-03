import { Component, OnInit } from '@angular/core';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { environment } from '../../../environments/environment';
import { Router } from '@angular/router';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit{

  loginError: string = "";

  constructor(private router: Router) {}

  ngOnInit() {
    firebase.initializeApp(environment.firebaseConfig);
  }

  logIn(email: string, password: string) {

    firebase.auth().signInWithEmailAndPassword(email, password)
      .then(() => {
        console.log("Utilisateur connecté avec succès !");
        // Effectuer la redirection vers la page unique de l'utilisateur
        const userId = firebase.auth().currentUser?.uid;
        this.router.navigate([`/user/${userId}`]); // Remplacez `/user/${userId}` par le chemin unique de la page de l'utilisateur
      })
      .catch((error) => {
        console.error("Erreur lors de la connexion de l'utilisateur :", error);
        this.loginError = error.message; // Affiche le message d'erreur complet renvoyé par Firebase
      });
  }

}

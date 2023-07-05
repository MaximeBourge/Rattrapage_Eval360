import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-create-project',
  templateUrl: './create-project.component.html',
  styleUrls: ['./create-project.component.css']
})
export class CreateProjectComponent implements OnInit {
  userId: string = '';
  projectCreated: boolean = false; // Variable pour suivre l'état de création du projet

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    firebase.initializeApp(environment.firebaseConfig);
    this.route.params.subscribe(params => {
      this.userId = params['userId']; // Récupère l'ID de l'utilisateur à partir des paramètres de route
    });
  }

  createProject(projectName: string) {
    // Vérifiez si l'ID de l'utilisateur est disponible
    if (!this.userId) {
      console.error("ID de l'utilisateur non disponible.");
      return;
    }

    // Créez une référence à la base de données Firebase
    const db = firebase.database();

    // Créez une référence à la collection de projets de l'utilisateur
    const projectsRef = db.ref(`users/${this.userId}/projects`);

    // Générez un nouvel identifiant de projet avec push()
    const newProjectRef = projectsRef.push();

    // Obtenez l'ID unique généré
    const projectId = newProjectRef.key;

    // Créez un objet représentant le projet à enregistrer
    const projectData = {
      id: projectId,
      name: projectName,
      // Ajoutez d'autres propriétés du projet ici si nécessaire
    };

    // Enregistrez le projet dans la base de données
    newProjectRef.set(projectData)
      .then(() => {
        console.log("Projet enregistré avec succès !");
        this.projectCreated = true; // Met à jour l'état de création du projet
        // Effectuez d'autres actions ou affichez un message de confirmation
      })
      .catch((error) => {
        console.error("Erreur lors de l'enregistrement du projet :", error);
        // Gérez l'erreur d'enregistrement du projet
      });
  }
}

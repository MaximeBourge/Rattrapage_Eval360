import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { environment } from '../../environments/environment';
import { Project } from './project.model';


@Component({
  selector: 'app-create-project',
  templateUrl: './create-project.component.html',
  styleUrls: ['./create-project.component.css']
})
export class CreateProjectComponent implements OnInit {
  userId: string = '';
  projectCreated: boolean = false; // Variable pour suivre l'état de création du projet
  message: string = '';

  constructor(private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    firebase.initializeApp(environment.firebaseConfig);
    this.route.params.subscribe(params => {
      this.userId = params['userId']; // Récupère l'ID de l'utilisateur à partir des paramètres de route
    });
  }

  createProject(projectName: string, projectDescription: string, projectDate: string) {
    // Vérifiez si l'ID de l'utilisateur est disponible
    if (!this.userId) {
      console.error("ID de l'utilisateur non disponible.");
      return;
    }

    // Vérifiez si tous les champs sont remplis
    if (!projectName || !projectDescription || !projectDate) {
      console.error("Veuillez remplir tous les champs.");
      this.projectCreated = false; // Définir la variable projectCreated à false en cas d'erreur
      this.message = "Veuillez remplir tous les champs.";
      this.hideMessageAfterDelay(3000); // Masquer le message après 3 secondes
      return;
    }

    // Vérifiez la longueur du nom du projet
    if (projectName.length > 16) {
      console.error("Le nom du projet ne peut pas dépasser 16 caractères.");
      this.projectCreated = false; // Définir la variable projectCreated à false en cas d'erreur
      this.message = "Le nom du projet ne peut pas dépasser 16 caractères.";
      this.hideMessageAfterDelay(3000); // Masquer le message après 3 secondes
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
      description: projectDescription,
      date: projectDate,
      groups: [], // Initialisez le champ "groups" à un tableau vide
      projectStatus: 0,
      // Ajoutez d'autres propriétés du projet ici si nécessaire
    };

    newProjectRef
      .set(projectData)
      .then(() => {
        console.log("Projet enregistré avec succès !");
        this.projectCreated = true; // Définir la variable projectCreated à true
        this.message = "Le projet a été créé avec succès !";
        this.hideMessageAfterDelay(3000); // Masquer le message après 3 secondes

        // Rediriger vers la page "list-of-projects" avec les paramètres de requête
        this.router.navigate(['/list-of-projects'], {
          queryParams: {
            id: projectId,
            name: projectName,
            description: projectDescription,
            date: projectDate
          }
        });
      })
      .catch((error) => {
        console.error("Erreur lors de l'enregistrement du projet :", error);
        this.projectCreated = false; // Définir la variable projectCreated à false en cas d'erreur
        // Gérez l'erreur d'enregistrement du projet
      });
  }

  hideMessageAfterDelay(delay: number) {
    setTimeout(() => {
      this.message = '';
    }, delay);
  }


  getProjectsForUser(): Promise<Project[]> {
    // Vérifiez si l'ID de l'utilisateur est disponible
    if (!this.userId) {
      console.error("ID de l'utilisateur non disponible.");
      return Promise.reject("ID de l'utilisateur non disponible.");
    }

    // Créez une référence à la base de données Firebase
    const db = firebase.database();

    // Créez une référence à la collection de projets de l'utilisateur
    const projectsRef = db.ref(`users/${this.userId}/projects`);

    // Récupérez les projets de l'utilisateur en écoutant les modifications
    return new Promise<Project[]>((resolve, reject) => {
      projectsRef.on(
        'value',
        (snapshot) => {
          const projects: Project[] = [];

          snapshot.forEach((childSnapshot) => {
            const project = childSnapshot.val() as Project;
            projects.push(project);
          });

          resolve(projects);
        },
        (error) => {
          console.error("Erreur lors de la récupération des projets :", error);
          reject("Erreur lors de la récupération des projets");
        }
      );
    });
  }


}

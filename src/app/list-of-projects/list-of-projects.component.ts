import { Component, OnInit, ElementRef, ViewChildren, QueryList } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { environment } from '../../environments/environment';
import { Project } from '../create-project/project.model';


@Component({
  selector: 'app-list-of-projects',
  templateUrl: './list-of-projects.component.html',
  styleUrls: ['./list-of-projects.component.css']
})
export class ListOfProjectsComponent implements OnInit {
  userId: string = '';
  status: string = '';
  items: HTMLElement[] = [];
  active: number = 0;
  projects: Project[] = [];


  constructor(private elementRef: ElementRef, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    firebase.initializeApp(environment.firebaseConfig);
    this.route.params.subscribe(params => {
      this.userId = params['userId']; // Récupère l'ID de l'utilisateur à partir des paramètres de route
    });

    this.getProjectsForUser()
      .then(projects => {
        this.projects = projects;
        console.log('Projets:', this.projects);
        this.active = 0; // Réinitialiser l'index actif à 0

        // Afficher le projet sélectionné dans la console
        console.log('Projet sélectionné:', this.projects[this.active]);

        this.loadShow(); // Appeler loadShow() une fois les projets récupérés

        // Appeler loadShow() une deuxième fois après un court délai pour afficher correctement les projets dès le chargement de la page
        setTimeout(() => {
          this.loadShow();
        }, 100);
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des projets:', error);
        // Gérer l'erreur de récupération des projets
      });
  }





  loadShow() {
    this.items = Array.from(this.elementRef.nativeElement.querySelectorAll('.slider .item'));

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const isActive = i === this.active;

      const titleElement = item.querySelector('h1');
      const descriptionElement = item.querySelector('p');

      if (isActive && this.projects[this.active]) {
        // Afficher le nom et la description du projet de l'élément actif s'ils sont définis
        if (titleElement) {
          titleElement.textContent = this.projects[this.active].name;
        }
        if (descriptionElement) {
          descriptionElement.textContent = this.projects[this.active].description;
        }
        this.status = this.projects[this.active].status; // Mettez à jour la propriété status
      } else {
        // Afficher le nom et la description de chaque projet
        if (titleElement) {
          titleElement.textContent = this.projects[i].name;
        }
        if (descriptionElement) {
          descriptionElement.textContent = this.projects[i].description;
        }
        this.status = ''; // Réinitialisez la propriété status
      }

      item.classList.toggle('active', isActive); // Ajouter ou supprimer la classe "active" en fonction de l'état du projet

      // Appliquer les styles spécifiques pour les projets actifs ou inactifs
      item.style.transform = isActive ? 'none' : `translateX(${120 * (i - this.active)}px) scale(${1 - 0.2 * Math.abs(i - this.active)}) perspective(16px) rotateY(${isActive ? '0' : (i - this.active > 0 ? '-1' : '1')}deg)`;
      item.style.zIndex = isActive ? '1' : '0';
      item.style.opacity = isActive ? '1' : '0.6';
      item.style.filter = isActive ? 'none' : 'blur(5px)';
    }
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
        snapshot => {
          const projects: Project[] = [];

          snapshot.forEach(childSnapshot => {
            const project = childSnapshot.val() as Project;
            projects.push(project);
          });

          resolve(projects);
        },
        error => {
          reject(error);
        }
      );
    });
  }

  nextClick() {
    const nextIndex = (this.active + 1) % this.projects.length;
    this.active = nextIndex;
    this.loadShow();
    console.log('Projet sélectionné:', this.projects[this.active]);
  }

  prevClick() {
    const prevIndex = (this.active - 1 + this.projects.length) % this.projects.length;
    this.active = prevIndex;
    this.loadShow();
    console.log('Projet sélectionné:', this.projects[this.active]);
  }

  navigateToProjectDetails(projectId: string) {
    this.router.navigate(['/project', projectId]);
  }


}

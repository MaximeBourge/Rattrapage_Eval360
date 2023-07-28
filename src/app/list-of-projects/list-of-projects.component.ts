import { Component, OnInit, ElementRef} from '@angular/core';
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


        // Afficher le projectStatus de tous les projets
        this.projects.forEach(project => {
          console.log(`Project ID: ${project.id}, Project Status: ${project.projectStatus}`);
        });

        this.active = 0; // Réinitialiser l'index actif à 0

        //console.log('Projet sélectionné:', this.projects[this.active]);

        this.loadShow();

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
      const project = this.projects[i];

      const titleElement = item.querySelector('h1');
      const descriptionElement = item.querySelector('p');
      const statusIndicator = item.querySelector('.status-indicator');

      // Remettre à zéro les classes pour l'indicateur de statut
      statusIndicator?.classList.remove('green', 'red');

      if (project) {
        if (titleElement) {
          titleElement.textContent = project.name;
        }
        if (descriptionElement) {
          descriptionElement.textContent = project.description;
        }

        // Mettre à jour la classe du voyant de statut en fonction de project.projectStatus
        if (project.projectStatus === 1) {
          statusIndicator?.classList.add('green');
        } else {
          statusIndicator?.classList.add('red');
        }
      } else {
        if (titleElement) {
          titleElement.textContent = '';
        }
        if (descriptionElement) {
          descriptionElement.textContent = '';
        }
      }

      item.classList.toggle('active', isActive);
      item.style.transform = isActive
        ? 'none'
        : `translateX(${120 * (i - this.active)}px) scale(${1 - 0.2 * Math.abs(i - this.active)}) perspective(16px) rotateY(${isActive ? '0' : (i - this.active > 0 ? '-1' : '1')}deg)`;
      item.style.zIndex = isActive ? '1' : '0';
      item.style.opacity = isActive ? '1' : '0.6';
      item.style.filter = isActive ? 'none' : 'blur(5px)';

      console.log('project.projectStatus:', project?.projectStatus);
      console.log('Type of project.projectStatus:', typeof project?.projectStatus);
    }
  }






  // Fonction pour vérifier le statut d'un projet en fonction de son ID
  checkProjectStatus(projectId: string): number {
    const project = this.projects.find((p) => p.id === projectId);

    if (project) {
      return project.projectStatus; // Renvoie le statut du projet s'il est trouvé dans la liste des projets
    } else {
      return 0; // Renvoie une chaîne vide si le projet n'est pas trouvé
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
    console.log('this.active:', this.active); // Ajouter cette ligne pour vérifier la valeur de this.active
    this.loadShow();
  }

  prevClick() {
    const prevIndex = (this.active - 1 + this.projects.length) % this.projects.length;
    this.active = prevIndex;
    console.log('this.active:', this.active); // Ajouter cette ligne pour vérifier la valeur de this.active
    this.loadShow();
  }


  navigateToProjectDetails(projectId: string) {
    this.router.navigate(['/teacher-home', this.userId, 'project', projectId]);
  }

  isProjectStatusGreen(projectStatus: string): boolean {
    return projectStatus === '1';
  }


}

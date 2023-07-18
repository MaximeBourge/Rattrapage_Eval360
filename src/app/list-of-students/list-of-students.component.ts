import { Component, OnInit, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-list-of-students',
  templateUrl: './list-of-students.component.html',
  styleUrls: ['./list-of-students.component.css']
})
export class ListOfStudentsComponent implements OnInit {
  userId: string = '';
  studentId: string = '';
  projectId: string = '';
  groupId: string = '';
  status: string = '';
  items: HTMLElement[] = [];
  active: number = 0;
  students: any[] = [];

  constructor(private elementRef: ElementRef, private route: ActivatedRoute, private router: Router) {}

  ngOnInit() {
    firebase.initializeApp(environment.firebaseConfig);
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
      this.projectId = params['projectId'];
      this.groupId = params['groupId'];
      this.studentId = params['studentId'];

      if (this.userId && this.projectId && this.groupId && this.studentId) {
        this.getStudentDetails(this.studentId)
          .then(student => {
            console.log('Étudiant ID:', this.studentId);
            console.log('Étudiant:', student);
            this.createUniqueLink(this.studentId);
          })
          .catch(error => {
            console.error('Erreur lors de la récupération des détails de l\'étudiant:', error);
          });
      }
    });

    this.getStudentsForUser()
      .then(students => {
        this.students = students;
        console.log('Élèves:', this.students);

        if (this.students.length === 0) {
          console.log('Aucun élève trouvé.');
          return;
        }

        this.active = 0;
        console.log('Élève sélectionné:', this.students[this.active]);

        this.loadShow();

        setTimeout(() => {
          this.loadShow();
        }, 100);
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des élèves:', error);
      });
  }

  loadShow() {
    this.items = Array.from(this.elementRef.nativeElement.querySelectorAll('.slider .item'));

    for (let i = 0; i < this.items.length; i++) {
      const item = this.items[i];
      const isActive = i === this.active;

      const nameElement = item.querySelector('.student-name');
      if (isActive && this.students[this.active]) {
        if (nameElement) {
          nameElement.textContent = this.students[this.active].prenom;
        }
        this.status = this.students[this.active].status;
      } else {
        if (nameElement) {
          nameElement.textContent = this.students[i].prenom;
        }
        this.status = '';
      }

      item.classList.toggle('active', isActive);
      item.style.transform = isActive ? 'none' : `translateY(${120 * (i - this.active)}px) scale(${1 - 0.2 * Math.abs(i - this.active)})`;
      item.style.zIndex = isActive ? '1' : '0';
      item.style.opacity = isActive ? '1' : '0.6';
      item.style.filter = isActive ? 'none' : 'blur(5px)';

      if (isActive) {
        console.log('Étudiant ID:', this.students[i].id); // Ajouter cette ligne pour afficher l'ID de l'étudiant actif
      }
    }
  }


  getStudentsForUser(): Promise<any[]> {
    if (!this.userId) {
      console.error("ID de l'utilisateur non disponible.");
      return Promise.reject("ID de l'utilisateur non disponible.");
    }

    const db = firebase.database();
    const projectGroupsRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${this.groupId}/students`);

    return new Promise<any[]>((resolve, reject) => {
      projectGroupsRef.on(
        'value',
        snapshot => {
          const students: any[] = [];

          snapshot.forEach(childSnapshot => {
            const studentId = childSnapshot.key; // Récupérer l'ID de l'étudiant
            const student = { id: studentId, ...childSnapshot.val() }; // Ajouter l'ID de l'étudiant à l'objet

            students.push(student);
          });

          resolve(students);
        },
        error => {
          reject(error);
        }
      );
    });
  }


  getStudentDetails(studentId: string): Promise<any> {
    if (!this.userId) {
      console.error("ID de l'utilisateur non disponible.");
      return Promise.reject("ID de l'utilisateur non disponible.");
    }

    const db = firebase.database();
    const studentRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${this.groupId}/students/${studentId}`);

    return new Promise<any>((resolve, reject) => {
      studentRef.on(
        'value',
        snapshot => {
          if (snapshot.exists()) {
            const student = snapshot.val();
            resolve(student);
          } else {
            reject("Aucun étudiant trouvé");
          }
        },
        error => {
          reject(error);
        }
      );
    });
  }

  createUniqueLink(studentId: string) {
    if (confirm('Voulez-vous créer un lien unique pour cet étudiant ?')) {
      const uniqueLink = this.generateUniqueLink();
      const expiration = Date.now() + (24 * 60 * 60 * 1000); // Ajout de 24 heures (en millisecondes) à l'horodatage de création

      this.saveUniqueLink(studentId, uniqueLink, expiration)
        .then(() => {
          console.log('Le lien unique a été enregistré pour l\'étudiant avec succès.');
        })
        .catch(error => {
          console.error('Erreur lors de l\'enregistrement du lien unique pour l\'étudiant:', error);
        });
    }
  }


  nextClick() {
    const nextIndex = (this.active + 1) % this.students.length;
    this.active = nextIndex;
    this.loadShow();
  }

  prevClick() {
    const prevIndex = (this.active - 1 + this.students.length) % this.students.length;
    this.active = prevIndex;
    this.loadShow();
  }


  navigateToStudentDetails(studentId: string) {
    if (!this.userId) {
      console.error("ID de l'utilisateur non disponible.");
      return;
    }

    const db = firebase.database();
    const studentRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${this.groupId}/students/${studentId}`);

    studentRef.once('value').then((snapshot) => {
      if (snapshot.exists()) {
        const student = snapshot.val();

        // Faites quelque chose avec les données de l'étudiant
        console.log('Étudiant:', student);

        // Créer le lien unique
        const uniqueLink = this.generateUniqueLink();
        const expiration = Date.now() + (24 * 60 * 60 * 1000); // Ajout de 24 heures (en millisecondes) à l'horodatage de création

        // Enregistrer le lien unique dans la base de données
        this.saveUniqueLink(studentId, uniqueLink, expiration)
          .then(() => {
            console.log('Le lien unique a été enregistré pour l\'étudiant avec succès.');

            // Rediriger vers la page des détails de l'étudiant
            this.router.navigate(['/teacher-home', this.userId, 'student', studentId]);
          })
          .catch(error => {
            console.error('Erreur lors de l\'enregistrement du lien unique pour l\'étudiant:', error);
          });
      } else {
        console.log('Aucun étudiant trouvé avec l\'ID:', studentId);
      }
    }).catch((error) => {
      console.error('Erreur lors de la récupération des détails de l\'étudiant:', error);
    });
  }



  generateUniqueLink(): string {
    // Code pour générer un lien unique
    // Vous pouvez utiliser une logique personnalisée pour générer un lien unique
    // Par exemple, vous pouvez générer une chaîne aléatoire ou un identifiant unique
    // Voici un exemple simple qui génère une chaîne aléatoire de 10 caractères :
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let link = '';
    for (let i = 0; i < 10; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      link += characters.charAt(randomIndex);
    }
    return link;
  }

  saveUniqueLink(studentId: string, uniqueLink: string, expiration: number): Promise<void> {
    if (!this.userId) {
      console.error("ID de l'utilisateur non disponible.");
      return Promise.reject("ID de l'utilisateur non disponible.");
    }

    const db = firebase.database();
    const uniqueLinkRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${this.groupId}/students/${studentId}/eval360`);

    const linkData = {
      formulaire: uniqueLink,
      expiration: expiration
    };

    return uniqueLinkRef.update(linkData)
      .then(() => {
        console.log('Lien unique:', uniqueLink);
        console.log('Étudiant ID:', studentId);
      })
      .catch(error => {
        console.error('Erreur lors de l\'enregistrement du lien unique pour l\'étudiant:', error);
      });
  }

}

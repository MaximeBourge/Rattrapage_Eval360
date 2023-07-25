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
  projectId: string = '';
  groupId: string = '';
  status: string = '';
  items: HTMLElement[] = [];
  active: number = 0;
  students: any[] = [];
  activeStudentId: string = '';
  confirmed: boolean = false;
  showConfirmationButton: boolean = false;

  constructor(
    private elementRef: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
  ) {
    // Initialisation de Firebase
    if (!firebase.apps.length) {
      firebase.initializeApp(environment.firebaseConfig);
    }
  }

  ngOnInit() {
    console.log('ngOnInit()');
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
      this.projectId = params['projectId'];
      this.groupId = params['groupId'];

      console.log('Paramètres extraits de l\'URL :', params);

      console.log('userId enregistré dans le localStorage:', this.userId);
      console.log('projectId enregistré dans le localStorage:', this.projectId);

      if (this.userId && this.projectId && this.groupId) {
        console.log('Tous les paramètres nécessaires sont disponibles.');
        this.getStudentIdsForUser()
          .then(studentIds => {
            const studentPromises = studentIds.map(studentId => this.getStudentDetails(studentId));
            return Promise.all(studentPromises)
              .then(students => {
                this.students = students;
                this.active = 0;
                this.activeStudentId = this.students[this.active]?.studentId;
                console.log('Élève sélectionné:', this.students[this.active]);
                this.loadShow();
              });
          })
          .catch(error => {
            console.error('Erreur lors de la récupération des élèves:', error);
          });
      } else {
        console.error('Certains paramètres sont manquants dans l\'URL.');
      }
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
    } else {
      if (nameElement) {
        nameElement.textContent = this.students[i].prenom;
      }
    }

    item.classList.toggle('active', isActive);
    item.style.transform = isActive ? 'none' : `translateY(${120 * (i - this.active)}px) scale(${1 - 0.2 * Math.abs(i - this.active)})`;
    item.style.zIndex = isActive ? '1' : '0';
    item.style.opacity = isActive ? '1' : '0.6';
    item.style.filter = isActive ? 'none' : 'blur(5px)';

      // Vérifier le studentStatus de chaque élève et affecter la couleur en conséquence
      if (this.students[i]) {
        const studentStatus = this.students[i].studentStatus;
        const statusColor = studentStatus === 0 ? 'red' : 'green';
        item.style.backgroundColor = isActive ? statusColor : '';
      } else {
        item.style.backgroundColor = '';
      }
    }
  }



  getStudentIdsForUser(): Promise<string[]> {
    if (!this.userId) {
      console.error("ID de l'utilisateur non disponible.");
      return Promise.reject("ID de l'utilisateur non disponible.");
    }

    const db = firebase.database();
    const studentsRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${this.groupId}/students`);

    return new Promise<string[]>((resolve, reject) => {
      studentsRef.once(
        'value',
        snapshot => {
          if (snapshot.exists()) {
            const studentIdsObject = snapshot.val();
            const studentIds = Object.keys(studentIdsObject);
            resolve(studentIds);
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

  nextClick() {
    const nextIndex = (this.active + 1) % this.students.length;
    this.active = nextIndex;
    this.activeStudentId = this.students[this.active]?.studentId;
    this.updateStatus(); // Ajouter cette ligne pour mettre à jour le status
    this.loadShow();
    console.log('Élève sélectionné:', this.students[this.active]);
    this.checkStudentStatus(this.activeStudentId);
  }

  prevClick() {
    const prevIndex = (this.active - 1 + this.students.length) % this.students.length;
    this.active = prevIndex;
    this.activeStudentId = this.students[this.active]?.studentId;
    this.updateStatus(); // Ajouter cette ligne pour mettre à jour le status
    this.loadShow();
    console.log('Élève sélectionné:', this.students[this.active]);
    this.checkStudentStatus(this.activeStudentId);
  }

  onStudentSelected(index: number) {
    this.active = index;
    this.activeStudentId = this.students[this.active]?.studentId;
    this.updateStatus(); // Ajouter cette ligne pour mettre à jour le status
    this.confirmed = false;
    this.showConfirmationButton = false;

    if (this.activeStudentId) {
      console.log('Étudiant sélectionné:', this.students[this.active]);
      console.log('ID de l\'étudiant actif:', this.activeStudentId);
      this.checkStudentStatus(this.activeStudentId);
      this.getStudentDetails(this.activeStudentId)
        .then(student => {
          console.log("Détails de l'étudiant :", student);
          console.log("LE STUDENT ID de l'élève ACTIF :", this.activeStudentId);

          this.showConfirmationButton = true;
        })
        .catch(error => {
          console.error('Erreur lors de la récupération des détails de l\'étudiant:', error);
        });
    } else {
      console.log('Aucun étudiant sélectionné.');
    }
  }

  updateStatus() {
    // Mettre à jour le studentStatus en fonction de l'élève actif
    if (this.activeStudentId) {
      const activeStudent = this.students.find(student => student.studentId === this.activeStudentId);
      if (activeStudent) {
        this.status = activeStudent.studentStatus === 0 ? 'red' : 'green';
      }
    } else {
      this.status = '';
    }
  }

  confirmAndCreateLink() {
    if (this.activeStudentId) {
      this.confirmed = true;
      console.log('Confirmation reçue pour la création du lien unique pour l\'étudiant avec ID:', this.activeStudentId);
      this.onStudentSelected(this.active);
    } else {
      console.log('Aucun étudiant actif pour confirmer la création du lien unique.');
    }
  }

  createUniqueLink(studentId: string) {
    if (!this.userId || !this.projectId || !this.groupId || !studentId) {
      console.error("Impossible de créer le lien unique. Certaines informations manquent.");
      return;
    }

    // Générer un lien unique
    const uniqueLink = `http://localhost:4200/tableau/${this.userId}/${this.projectId}/${this.groupId}/${studentId}`;

    // Enregistrer le lien unique dans la base de données Firebase
    const db = firebase.database();
    const linkRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${this.groupId}/students/${studentId}/eval360`);

    const eval360Data = {
      formulaireLocal: uniqueLink,
    };

    linkRef.set(eval360Data)
      .then(() => {
        console.log(`Eval360 créé pour l'étudiant avec ID: ${studentId}`);
        console.log("Lien unique:", uniqueLink);
      })
      .catch(error => {
        console.error('Erreur lors de la création de l\'eval360:', error);
      });
  }


  checkStudentStatus(studentId: string): void {
    if (!this.userId || !this.projectId || !this.groupId || !studentId) {
      console.error("Impossible de vérifier le statut de l'étudiant. Certaines informations manquent.");
      return;
    }

    // Accédez à la référence appropriée dans la base de données Firebase
    const db = firebase.database();
    const studentStatusRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${this.groupId}/students/${studentId}/studentStatus`);

    studentStatusRef.on(
      'value',
      snapshot => {
        const studentStatus = snapshot.val();
        this.status = studentStatus === 0 ? 'red' : 'green';
        // Afficher le studentStatus dans la console ici
        console.log('studentStatus pour l\'étudiant:', studentStatus);
      },
      error => {
        console.error('Erreur lors de la récupération du statut de l\'étudiant:', error);
      }
    );
  }


}

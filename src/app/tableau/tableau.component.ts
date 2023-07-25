import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-tableau',
  templateUrl: './tableau.component.html',
  styleUrls: ['./tableau.component.css']
})
export class TableauComponent implements OnInit {
  userId: string = '';
  studentId: string = '';
  projectId: string = '';
  groupId: string = '';
  student: any = null;
  studentsInGroup: any[] = [];
  currentStudentId: string = '';
  isFormIncomplete: boolean = false;
  currentUserMarksRef: any;

  noteResultat: number = 0;
  noteObjectif: number = 0;
  noteCompetence: number = 0;
  noteImplication: number = 0;
  noteCommunication: number = 0;

  noteFinale: number = 0;

  coeffResultat: number = 0.6;
  coeffCompetence: number = 0.1;
  coeffImplication: number = 0.15;
  coeffCommunication: number = 0.15;

  noteResultatErrorMsg: string = '';
  noteObjectifErrorMsg: string = '';
  noteCompetenceErrorMsg: string = '';
  noteImplicationErrorMsg: string = '';
  noteCommunicationErrorMsg: string = '';

  constructor(private route: ActivatedRoute, private router: Router) {
    firebase.initializeApp(environment.firebaseConfig);
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
      this.projectId = params['projectId'];
      this.groupId = params['groupId'];
      this.studentId = params['studentId'];

      this.currentStudentId = this.studentId;

      // Référence au nœud "marks" de l'étudiant courant
      this.currentUserMarksRef = firebase.database().ref(`users/${this.userId}/projects/${this.projectId}/groups/${this.groupId}/students/${this.studentId}/eval360/marks`);

      this.getStudentDetails()
        .then(student => {
          this.student = student;
        })
        .catch(error => {
          console.error('Erreur lors de la récupération des détails de l\'étudiant:', error);
        });

      this.getStudentsInGroup(this.groupId)
        .then(studentsInGroup => {
          this.studentsInGroup = studentsInGroup;

          // Générer des noms complets pour les étudiants (Nom + Prénom)
          this.studentsInGroup.forEach(student => {
            student.nomComplet = student.nom + ' ' + student.prenom;
            student.marks = {};
          });
        })
        .catch(error => {
          console.error('Erreur lors de la récupération de la liste des étudiants du groupe:', error);
        });
    });
  }

  onFormSubmit(): void {
    // Vérifier si toutes les notes ont été attribuées
  const incompleteStudents = this.studentsInGroup.filter(student => {
    return (
      student.noteObjectif === undefined ||
      student.noteCompetence === undefined ||
      student.noteImplication === undefined ||
      student.noteCommunication === undefined
    );
  });

    if (incompleteStudents.length > 0) {
      console.error('Veuillez attribuer les 4 notes à tous les étudiants avant d\'enregistrer.');
      return;
    }

    // Enregistrement des notes dans le nœud "marks" de l'étudiant courant
  const currentUserMarks: { [studentName: string]: any } = {}; // Utiliser la clé générique pour les étudiants

  this.studentsInGroup.forEach(student => {
    currentUserMarks[student.nomComplet] = { // Utiliser le nom complet de l'étudiant comme clé
      noteObjectif: student.noteObjectif !== undefined ? student.noteObjectif : null, // Conserver les notes existantes si elles sont définies
      noteCompetence: student.noteCompetence !== undefined ? student.noteCompetence : null,
      noteImplication: student.noteImplication !== undefined ? student.noteImplication : null,
      noteCommunication: student.noteCommunication !== undefined ? student.noteCommunication : null
    };
  });

    this.currentUserMarksRef.set(currentUserMarks);

    // Mise à jour du studentStatus à 1
  const studentStatusRef = firebase.database().ref(`users/${this.userId}/projects/${this.projectId}/groups/${this.groupId}/students/${this.studentId}/studentStatus`);
  studentStatusRef.set(1)
    .then(() => {
      console.log(`studentStatus mis à jour pour l'étudiant ${this.studentId}`);
    })
    .catch(error => {
      console.error(`Erreur lors de la mise à jour du studentStatus pour l'étudiant ${this.studentId}:`, error);
    });
  }

  updateStudentsNotesInDatabase(): void {
    this.studentsInGroup.forEach(student => {
      if (
        student.noteObjectif !== undefined &&
        student.noteCompetence !== undefined &&
        student.noteImplication !== undefined &&
        student.noteCommunication !== undefined
      ) {
        this.updateStudentNotes(
          student.noteObjectif.toString(),
          student.noteCompetence.toString(),
          student.noteImplication.toString(),
          student.noteCommunication.toString()
        )
          .then(() => {
            console.log(`Notes mises à jour pour l'étudiant ${student.studentId}`);
          })
          .catch(error => {
            console.error(`Erreur lors de la mise à jour des notes pour l'étudiant ${student.studentId}:`, error);
          });
      }
    });
  }


  isNoteInRange(note: number, range: { min: number, max: number }): boolean {
    return note >= range.min && note <= range.max;
  }

  resetErrorMessages(): void {
    this.noteResultatErrorMsg = '';
    this.noteObjectifErrorMsg = '';
    this.noteCompetenceErrorMsg = '';
    this.noteImplicationErrorMsg = '';
    this.noteCommunicationErrorMsg = '';
  }

  updateStudentNotes(noteObjectif: string, noteCompetence: string, noteImplication: string, noteCommunication: string): Promise<void> {
    if (!this.userId || !this.projectId || !this.groupId || !this.studentId) {
      console.error('ID de l\'utilisateur, du projet, du groupe ou de l\'étudiant non disponible.');
      return Promise.reject('ID de l\'utilisateur, du projet, du groupe ou de l\'étudiant non disponible.');
    }

    const db = firebase.database();
    const studentRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${this.groupId}/students/${this.studentId}`);

    return studentRef.update({
      noteObjectif: parseFloat(noteObjectif),
      noteCompetence: parseFloat(noteCompetence),
      noteImplication: parseFloat(noteImplication),
      noteCommunication: parseFloat(noteCommunication)
    });
  }

  getStudentDetails(): Promise<any> {
    if (!this.userId || !this.projectId || !this.groupId || !this.studentId) {
      console.error('ID de l\'utilisateur, du projet, du groupe ou de l\'étudiant non disponible.');
      return Promise.reject('ID de l\'utilisateur, du projet, du groupe ou de l\'étudiant non disponible.');
    }

    const db = firebase.database();
    const studentRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${this.groupId}/students/${this.studentId}`);

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

  getStudentsInGroup(groupId: string): Promise<any[]> {
    if (!this.userId || !this.projectId || !groupId) {
      console.error('ID de l\'utilisateur, du projet ou du groupe non disponible.');
      return Promise.reject('ID de l\'utilisateur, du projet ou du groupe non disponible.');
    }

    const db = firebase.database();
    const studentsRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${groupId}/students`);

    return new Promise<any[]>((resolve, reject) => {
      studentsRef.once(
        'value',
        snapshot => {
          if (snapshot.exists()) {
            const studentsObject = snapshot.val();
            const studentsInGroup = Object.values(studentsObject);
            resolve(studentsInGroup);
          } else {
            reject("Aucun étudiant trouvé dans ce groupe.");
          }
        },
        error => {
          reject(error);
        }
      );
    });
  }
}

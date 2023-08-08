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

  coeffObjectif: number = 0.6;
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

      console.log('User ID:', this.userId);
      console.log('Project ID:', this.projectId);
      console.log('Group ID:', this.groupId);
      console.log('Student ID:', this.studentId);

      this.currentStudentId = this.studentId;

      // Référence au nœud "marks" de l'étudiant courant
      this.currentUserMarksRef = firebase.database().ref(`users/${this.userId}/projects/${this.projectId}/groups/${this.groupId}/students/${this.studentId}/eval360/marks`);

      this.getStudentDetails()
        .then(student => {
          console.log('Student Details:', student);
          this.student = student;
        })
        .catch(error => {
          console.error('Erreur lors de la récupération des détails de l\'étudiant:', error);
        });

      this.getStudentsInGroup(this.groupId)
        .then(studentsInGroup => {
          console.log('Students in Group:', studentsInGroup);
          this.studentsInGroup = studentsInGroup;

          // Générer des noms complets pour les étudiants (Nom + Prénom)
          this.studentsInGroup.forEach(student => {
            student.nomComplet = student.nom + ' ' + student.prenom;
            student.marks = {};
          });
          // Trouver l'étudiant actif (celui qui attribue les notes)
          const studentActif = this.studentsInGroup.find(student => student.studentId === this.studentId);
          // Vérifier si l'étudiant actif a été trouvé et récupérer son nom complet
        if (studentActif) {
          const eleveConnecte = studentActif.nomComplet;

          // Maintenant, vous pouvez utiliser eleveConnecte pour créer les clés des notes finales comme mentionné précédemment
        } else {
          console.error('Étudiant actif non trouvé dans la liste des étudiants du groupe.');
        }
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

    // Calculer la note finale pour tout le groupe en utilisant les valeurs des notes pondérées
  this.studentsInGroup.forEach(student => {
    console.log('Calculating final grade for student:', student.nomComplet);
    student.noteFinale = (
      student.noteObjectif * this.coeffObjectif +
      student.noteCompetence * this.coeffCompetence +
      student.noteImplication * this.coeffImplication +
      student.noteCommunication * this.coeffCommunication
    ) / (this.coeffObjectif + this.coeffCompetence + this.coeffImplication + this.coeffCommunication);
  });

  console.log('Final Grades:', this.studentsInGroup);

    // Enregistrement des notes et de la note finale dans le nœud "marks" de l'étudiant courant
    const currentUserMarks: { [studentName: string]: any } = {};

    this.studentsInGroup.forEach(student => {
      const noteFinaleKey = `noteFinaleGivenTo${student.nomComplet}`; // Créer une clé unique avec le nom de l'étudiant
      currentUserMarks[noteFinaleKey] = {
        noteObjectif: student.noteObjectif !== undefined ? student.noteObjectif : null,
        noteCompetence: student.noteCompetence !== undefined ? student.noteCompetence : null,
        noteImplication: student.noteImplication !== undefined ? student.noteImplication : null,
        noteCommunication: student.noteCommunication !== undefined ? student.noteCommunication : null,
        noteFinale: student.noteFinale
      };
    });

    // Enregistrement des notes finales pour les autres étudiants
  this.studentsInGroup.forEach(student => {
    if (student.studentId !== this.currentStudentId) {
      this.saveNoteFinaleForStudent(student.studentId, student.noteFinale)
        .then(() => {
          console.log(`Note finale enregistrée pour l'étudiant ${student.prenom} ${student.nom}`);
        })
        .catch(error => {
          console.error(`Erreur lors de l'enregistrement de la note finale pour l'étudiant ${student.prenom} ${student.nom}:`, error);
        });
    }
  });

    this.currentUserMarksRef.update(currentUserMarks)
    .then(() => {
      console.log('Les notes ont été enregistrées avec succès, y compris la note finale.');
    });

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
            this.noteResultat = student.noteResultat || 0; // Récupérer la valeur de noteResultat, ou mettre 0 par défaut
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

  saveNoteFinaleForStudent(studentId: string, noteFinale: number): Promise<void> {
    if (!this.userId || !this.projectId || !this.groupId || !studentId || noteFinale === undefined) {
      console.error('Paramètres invalides pour enregistrer la note finale.');
      return Promise.reject('Paramètres invalides pour enregistrer la note finale.');
    }

    const db = firebase.database();

    // Chemin de la base de données de l'élève destinataire
    const targetStudentMarksRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${this.groupId}/students/${studentId}/eval360/marks/received`);

    // Utilisez .push() pour ajouter la nouvelle note finale à la liste
    return targetStudentMarksRef.push(noteFinale)
      .then(() => {
        console.log(`Note finale enregistrée pour l'étudiant ${studentId}`);
      })
      .catch(error => {
        console.error(`Erreur lors de l'enregistrement de la note finale pour l'étudiant ${studentId}:`, error);
      });
  }



}

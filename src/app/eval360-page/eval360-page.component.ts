import { Component, OnInit, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { environment } from '../../environments/environment';


export interface Student {
  eval360: {
    formulaireLocal: string;
    marks: {
      noteCommunication: number;
      noteCompetence: number;
      noteFinale: number;
      noteImplication: number;
      noteObjectif: number;
      received: {
        [key: string]: number;
      };
    };
  };
  nom: string;
  prenom: string;
  studentId: string;
  studentStatus: number;
}

@Component({
  selector: 'app-eval360-page',
  templateUrl: './eval360-page.component.html',
  styleUrls: ['./eval360-page.component.css']
})
export class Eval360PageComponent implements OnInit {
  userId: string = ''; // ID de l'utilisateur actuel
  projectId: string = ''; // ID du projet courant
  groups: any[] = []; // Tableau pour stocker les groupes

  constructor(
    private elementRef: ElementRef,
    private route: ActivatedRoute,
    private router: Router,
  ) {

    if (!firebase.apps.length) {
      firebase.initializeApp(environment.firebaseConfig);
    }
  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
      this.projectId = params['projectId'];

      if (this.userId && this.projectId) {
        this.getGroupsOfCurrentProject();
      }
    });
  }

  getGroupsOfCurrentProject() {
    if (!this.userId || !this.projectId) {
      console.error('UserID or ProjectID is missing.');
      return;
    }

    const projectRef = firebase.database().ref(`users/${this.userId}/projects/${this.projectId}/groups`);

    projectRef.once('value')
      .then(snapshot => {
        const groups: any[] = [];

        snapshot.forEach(groupSnapshot => {
          const group = groupSnapshot.val();
          group.groupId = groupSnapshot.key;

          const students: Student[] = [];
          groupSnapshot.child('students').forEach(studentSnapshot => {
            const student = studentSnapshot.val();
            students.push(student);
          });
          group.students = students;

          groups.push(group);


          const groupAverage = this.calculateAverageOfGroup(students);
          group.averageGroup = groupAverage;


          for (const student of group.students) {
            const receivedNotes = this.getReceivedNotes(student);
            const average = this.calculateAverageNotes(student);

            group.average360Group = group.average360Group || [];
            group.average360Group.push(average);

            const eval360Value = this.calculateEval360(student, group);
          }
        });

        for (const group of groups) {
          //console.log(`Group: ${group.groupName}, Average: ${group.averageGroup}`);
        }

        this.groups = groups;

        this.getReceivedNotesForAllStudents();
      })
      .catch(error => {
        console.error('Erreur lors de la récupération des groupes :', error);
      });
  }




  getStudentsOfGroup(groupId: string): Student[] | null {
    const group = this.groups.find(g => g.groupId === groupId);
    return group ? group.students : null;
  }

  getReceivedNotes(student: Student): number[] | null {
    const receivedData = student?.eval360?.marks?.received;

    if (receivedData) {
      const receivedValues: number[] = Object.values(receivedData);
      return receivedValues;
    }

    return null;
  }


  getReceivedNotesForAllStudents() {
    for (const group of this.groups) {
      //console.log(`Group: ${group.groupName}`);

      for (const student of group.students) {
        const receivedNotes = this.getReceivedNotes(student);
        //console.log(`Student: ${student.nom} ${student.prenom}, Group: ${group.groupName}, Received Notes:`, receivedNotes);
      }
    }
  }

  calculateAverageNotes(student: Student): number | null {
    const receivedData = student?.eval360?.marks?.received;

    if (receivedData) {
      const receivedValues: number[] = Object.values(receivedData);
      const sum = receivedValues.reduce((acc, val) => acc + val, 0);
      const average = sum / receivedValues.length;
      return parseFloat(average.toFixed(2)); // Convertir en nombre avec 2 décimales
    }

    return null;
  }

  calculateAverageOfGroup(students: Student[]): number | null {
    const receivedValues: number[] = [];

    for (const student of students) {
      const receivedData = student?.eval360?.marks?.received;
      if (receivedData) {
        const receivedNotes: number[] = Object.values(receivedData);
        //console.log("Received Notes:", receivedNotes); // Ajout du log pour vérification
        receivedValues.push(...receivedNotes);
      }
    }

    if (receivedValues.length > 0) {
      const sum = receivedValues.reduce((acc, val) => acc + val, 0);
      const average = sum / receivedValues.length;
      return parseFloat(average.toFixed(2)); // Convertir en nombre avec 2 décimales
    }

    return null;
  }

  convertToNumberAndFormat(value: any): string {
    const numericValue = parseFloat(value);
    return isNaN(numericValue) ? 'N/A' : numericValue.toFixed(2);
  }

  calculateDifference(student: Student, group: any): number | null {
    const studentAverage = this.calculateAverageNotes(student);
    const groupAverage = group.averageGroup;

    if (studentAverage !== null && groupAverage !== null) {
      const difference = studentAverage - groupAverage;
      //console.log(`Student Average: ${studentAverage}, Group Average: ${groupAverage}, Difference: ${difference}`);
      return difference;
    }

    return null;
  }

  calculateEval360(student: Student, group: any): number {
    let difference = this.calculateDifference(student, group);

    if (difference === null || difference >= 0) {
      difference = 0;
    }

    const groupMark = parseFloat(group.groupMark);
    const eval360Value = groupMark + difference;

    let roundedEval360: number;
    if (eval360Value % 0.5 === 0) {
      roundedEval360 = eval360Value;
    } else if (eval360Value > 0) {
      roundedEval360 = Math.floor(eval360Value / 0.5) * 0.5;
    } else {
      roundedEval360 = Math.ceil(eval360Value / 0.5) * 0.5;
    }


    if (roundedEval360 < 0) {
      roundedEval360 = 0;
    }


    console.log(`${student.prenom}, Jury: ${groupMark}, Difference: ${difference}, Eval360: ${roundedEval360}`);
    return roundedEval360;
  }


}

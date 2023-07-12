import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { generateExampleCSV } from './example-csv-generator';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { environment } from '../../environments/environment';
import * as nodemailer from 'nodemailer';
import * as jwt from 'jsonwebtoken';


@Component({
  selector: 'app-in-the-project-selected',
  templateUrl: './in-the-project-selected.component.html',
  styleUrls: ['./in-the-project-selected.component.css']
})
export class InTheProjectSelectedComponent {
  userId: string = '';
  projectId: string = '';
  newCard: any = {
    groupName: '',
    file: null
  };
  groupCards: any[] = [];
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    firebase.initializeApp(environment.firebaseConfig);
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.userId = params['userId'];
      this.projectId = params['projectId']; // Récupère l'ID du projet à partir des paramètres de route
    });

    // Reste du code pour la récupération des projets de l'utilisateur...
  }

  handleSpecialCardClick() {
    // Vérifier si le nom de groupe et le fichier ont été spécifiés
    if (!this.newCard.file || !this.newCard.groupName) {
      this.errorMessage = "Veuillez sélectionner un fichier CSV et spécifier un nom de groupe.";
      return; // Arrêter l'exécution de la fonction si les conditions ne sont pas remplies
    }

    // Créer une nouvelle carte de groupe
    const newGroupCard = {
      group: this.newCard.groupName,
      file: this.newCard.file
    };
    this.groupCards.push(newGroupCard);

    // Réinitialiser la carte "new card"
    this.newCard = {
      groupName: '',
      file: null
    };

    // Réinitialiser le message d'erreur
    this.errorMessage = '';

    // Ajouter le groupe à la base de données Firebase
    const db = firebase.database();
    const projectGroupsRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups`);
    const newGroupRef = projectGroupsRef.push();
    newGroupRef.set(newGroupCard)
      .then(() => {
        console.log('Groupe ajouté au projet dans la base de données Firebase.');

        // Ajouter les élèves du fichier CSV à la base de données
        const reader = new FileReader();
        reader.onload = (event: any) => {
          const csvData = event.target.result;
          const students = this.parseCSV(csvData);
          const groupStudentsRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${newGroupRef.key}/students`);
          groupStudentsRef.set(students)
            .then(() => {
              console.log('Liste des élèves ajoutée à la base de données Firebase.');
            })
            .catch((error) => {
              console.error('Erreur lors de l\'ajout de la liste des élèves à la base de données Firebase:', error);
            });
        };
        reader.readAsText(newGroupCard.file);
      })
      .catch((error) => {
        console.error(
          "Erreur lors de l'ajout du groupe au projet dans la base de données Firebase:",
          error
        );
      });
  }


  handleFileInput(event: any) {
    const file = event.target.files[0];
    if (file) {
      console.log('Fichier sélectionné:', file.name);
      this.newCard.file = file;
    }
  }

  downloadExampleCSV(): void {
    const csvContent = generateExampleCSV();
    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    const csvURL = window.URL.createObjectURL(csvBlob);
    const anchorElement = document.createElement('a');
    anchorElement.href = csvURL;
    anchorElement.download = 'example.csv';
    anchorElement.click();
    window.URL.revokeObjectURL(csvURL);
  }

  deleteGroupCard(card: any) {
    const index = this.groupCards.indexOf(card);
    if (index !== -1) {
      this.groupCards.splice(index, 1);
    }
  }

  parseCSV(csvData: string): any[] {
    const lines = csvData.split('\n');
    const header = lines[0].split(',');
    const students = [];

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].split(',');
      if (line.length === header.length) {
        const student: any = {};
        for (let j = 0; j < header.length; j++) {
          student[header[j].trim()] = line[j].trim();
        }
        students.push(student);
      }
    }

    return students;
  }



}

import { Component } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { generateExampleCSV } from './example-csv-generator';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { environment } from '../../environments/environment';
import { v4 as uuidv4 } from 'uuid';


@Component({
  selector: 'app-in-the-project-selected',
  templateUrl: './in-the-project-selected.component.html',
  styleUrls: ['./in-the-project-selected.component.css']
})
export class InTheProjectSelectedComponent {
  userId: string = '';
  projectId: string = '';
  newCard: any = {
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

    // Récupérer les groupes existants dans la base de données
    const db = firebase.database();
    const projectGroupsRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups`);

    projectGroupsRef.once('value').then((snapshot) => {
      snapshot.forEach((childSnapshot) => {
        const group = childSnapshot.val();
        this.groupCards.push({
          group: group.groupName
        });
      });
    });
  }

  handleSpecialCardClick() {
    // Vérifier si le fichier a été spécifié
    if (!this.newCard.file) {
      this.errorMessage = "Veuillez sélectionner un fichier CSV.";
      return; // Arrêter l'exécution de la fonction si les conditions ne sont pas remplies
    }

    const reader = new FileReader();
    reader.onload = (event: any) => {
      const csvData = event.target.result;
      const groups = this.parseCSV(csvData);
      this.groupCards = []; // Réinitialiser la liste des groupCards

      // Utiliser une Map pour stocker les groupes uniques avec leurs élèves correspondants
      const uniqueGroupsMap = new Map<string, string[]>();

      // Ajouter chaque élève au groupe correspondant dans la Map
      for (const group of groups) {
        const groupName = group.groupName;
        const student = group.students[0];

        if (!uniqueGroupsMap.has(groupName)) {
          uniqueGroupsMap.set(groupName, []);
        }
        uniqueGroupsMap.get(groupName)?.push(student);
      }

      // Ajouter chaque groupe à la base de données
      for (const [groupName, students] of uniqueGroupsMap) {
        const group = {
          groupName,
          students
        };
        this.addGroupToDatabase(group);
      }
    };
    reader.readAsText(this.newCard.file);
  }

  addGroupToDatabase(group: any) {
    // Vérifier si le groupe existe déjà dans groupCards
    const groupExistsInCards = this.groupCards.some((card) => card.group === group.groupName);
    if (groupExistsInCards) {
      return; // Ne pas ajouter le groupe à la base de données s'il existe déjà dans groupCards
    }

    // Vérifier si le groupe existe déjà dans la base de données
    const db = firebase.database();
    const projectGroupsRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups`);
    console.log('projectGroupsRef:', projectGroupsRef.toString()); // Débogage

    projectGroupsRef
      .orderByChild('groupName')
      .equalTo(group.groupName)
      .once('value')
      .then((snapshot) => {
        console.log('snapshot.exists():', snapshot.exists()); // Débogage
        if (snapshot.exists()) {
          console.log('Le groupe existe déjà dans la base de données.');
        } else {
          // Ajouter le groupe à la base de données Firebase
          const newGroupRef = projectGroupsRef.push();

          if (newGroupRef.key !== null) {
            newGroupRef
              .set(group)
              .then(() => {
                console.log('Groupe ajouté au projet dans la base de données Firebase.');
                this.addStudentsToGroup(newGroupRef.key!, group.students);
                console.log('Contenu du groupe :', group);

                // Ajouter le groupe à groupCards
                this.groupCards.push({
                  group: group.groupName
                });
              })
              .catch((error) => {
                console.error(
                  "Erreur lors de l'ajout du groupe au projet dans la base de données Firebase:",
                  error
                );
              });
          } else {
            console.error("Impossible de générer un identifiant pour le nouveau groupe.");
          }
        }
      })
      .catch((error) => {
        console.error("Erreur lors de la vérification de l'existence du groupe dans la base de données:", error);
      });
  }

  getUniqueGroups(groups: any[]): any[] {
    const uniqueGroups = new Set();

    for (const group of groups) {
      uniqueGroups.add(group.groupName);
    }

    return Array.from(uniqueGroups);
  }

  addStudentsToGroup(groupId: string, students: string[]) {
    const db = firebase.database();
    const groupStudentsRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${groupId}/students`);
    const studentsData = students.map((student) => {
      return {
        prenom: student
      };
    });
    groupStudentsRef.set(studentsData)
      .then(() => {
        console.log('Liste des  élèves ajoutée à la base de données Firebase.');
      })
      .catch((error) => {
        console.error('Erreur lors de l\'ajout de la liste des élèves à la base de données Firebase:', error);
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
      const groupName = card.group;
      this.groupCards.splice(index, 1);

      // Supprimer le groupe de la base de données Firebase
      const db = firebase.database();
      const projectGroupsRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups`);

      projectGroupsRef
        .orderByChild('groupName')
        .equalTo(groupName)
        .once('value')
        .then((snapshot) => {
          snapshot.forEach((childSnapshot) => {
            childSnapshot.ref.remove()
              .then(() => {
                console.log('Groupe supprimé de la base de données Firebase.');
              })
              .catch((error) => {
                console.error("Erreur lors de la suppression du groupe de la base de données Firebase:", error);
              });
          });
        })
        .catch((error) => {
          console.error("Erreur lors de la recherche du groupe dans la base de données:", error);
        });
    }
  }

  parseCSV(csvData: string): any[] {
    const lines = csvData.split('\n');
    const groups = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].split(',');
      if (line.length === 5) {
        const group: any = {
          groupName: line[4].trim(),
          students: []
        };
        for (let j = 0; j < 3; j++) {
          group.students.push(line[j].trim());
        }
        groups.push(group);
      }
    }

    return groups;
  }

  navigateToGroupTable(groupName: string) {
    const groupId = this.groupCards.find((card) => card.group === groupName)?.id;
    if (groupId) {
      this.router.navigate(['/teacher-home', this.userId, 'project', this.projectId, 'group', groupId]);
    }
  }
}

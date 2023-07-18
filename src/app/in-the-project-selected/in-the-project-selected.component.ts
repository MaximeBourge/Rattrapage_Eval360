import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { generateExampleCSV } from './example-csv-generator';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-in-the-project-selected',
  templateUrl: './in-the-project-selected.component.html',
  styleUrls: ['./in-the-project-selected.component.css']
})
export class InTheProjectSelectedComponent implements OnInit {
  userId: string = '';
  projectId: string = '';
  newCard: any = {
    file: null
  };
  groupCards: any[] = [];
  errorMessage: string = '';
  showNewCard: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) {
    firebase.initializeApp(environment.firebaseConfig);
  }

  ngOnInit() {
    this.route.params.subscribe((params) => {
      this.userId = params['userId'];
      this.projectId = params['projectId'];

      // Vérifier si l'ID du groupe est présent dans les paramètres d'URL
      if (params['groupId']) {
        const groupId = decodeURIComponent(params['groupId']);

        // Récupérer les informations du groupe à partir de la base de données en utilisant l'ID du groupe
        const db = firebase.database();
        const groupRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${groupId}`);
        groupRef.once('value').then((snapshot) => {
          const group = snapshot.val();
          // Utilisez les informations du groupe récupérées pour afficher les détails dans le composant
        });
      } else {
        // Récupérer les groupes existants dans la base de données
        const db = firebase.database();
        const projectGroupsRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups`);

        projectGroupsRef.once('value').then((snapshot) => {
          snapshot.forEach((childSnapshot) => {
            const group = childSnapshot.val();
            this.groupCards.push({
              id: childSnapshot.key,
              group: group.groupName
            });
          });

          this.showNewCard = this.groupCards.length === 0; // Afficher la carte "newCard" uniquement s'il n'y a aucun groupe créé
        });
      }
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

    // Ajouter le groupe à la base de données Firebase
    const db = firebase.database();
    const projectGroupsRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups`);
    const newGroupRef = projectGroupsRef.push();

    if (newGroupRef.key !== null) {
      const groupId = newGroupRef.key; // Récupérer l'ID du groupe généré

      newGroupRef
        .set(group)
        .then(() => {
          console.log('Groupe ajouté au projet dans la base de données Firebase.');
          this.addStudentsToGroup(groupId, group.students);
          console.log('Contenu du groupe :', group);

          // Ajouter le groupe à groupCards
          this.groupCards.push({
            id: groupId, // Utiliser l'ID du groupe généré
            group: group.groupName,
            students: group.students
          });

          this.showNewCard = false; // Masquer la carte "newCard" après avoir créé un groupe
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

  addStudentsToGroup(groupId: string, students: string[]) {
    const db = firebase.database();
    const groupStudentsRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${groupId}/students`);
    const studentsData = students.map((student) => {
      return {
        prenom: student
      };
    });
    groupStudentsRef
      .set(studentsData)
      .then(() => {
        console.log('Liste des élèves ajoutée à la base de données Firebase.');
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
      const groupId = card.id;
      this.groupCards.splice(index, 1);

      // Supprimer le groupe de la base de données Firebase
      const db = firebase.database();
      const groupRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${groupId}`);

      groupRef
        .remove()
        .then(() => {
          console.log('Groupe supprimé de la base de données Firebase.');
          this.deleteStudentsFromGroup(groupId);
        })
        .catch((error) => {
          console.error("Erreur lors de la suppression du groupe de la base de données Firebase:", error);
        });
    }
  }

  deleteStudentsFromGroup(groupId: string) {
    const db = firebase.database();
    const groupStudentsRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${groupId}/students`);

    groupStudentsRef
      .remove()
      .then(() => {
        console.log('Liste des élèves supprimée de la base de données Firebase.');
      })
      .catch((error) => {
        console.error('Erreur lors de la suppression de la liste des élèves de la base de données Firebase:', error);
      });
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

  // Méthode pour la redirection vers la page de la liste des étudiants du groupe
navigateToStudentList(groupId: string) {
  const encodedGroupId = encodeURIComponent(groupId);
  const url = `/teacher-home/${this.userId}/project/${this.projectId}/group/${encodedGroupId}/students`;
  this.router.navigate([url]);
}

}

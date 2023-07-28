import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
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

      if (params['groupId']) {
        const groupId = decodeURIComponent(params['groupId']);

        // Récupérer les informations du groupe à partir de la base de données en utilisant l'ID du groupe
        const db = firebase.database();
        const groupRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${groupId}`);
        groupRef.once('value').then((snapshot) => {
          const group = snapshot.val();
          const students = group.students || {};

          // Convertir les étudiants en tableau pour pouvoir les traiter plus facilement
          const studentsArray = Object.values(students);

          // Utiliser l'ID unique de l'élève comme clé dans la liste des étudiants du groupe
          const updatedStudents: { [key: string]: any } = {};
          studentsArray.forEach((student: any) => { // Assertion de type 'any'
            const studentId = student.studentId;
            updatedStudents[studentId] = student;
          });

          group.students = updatedStudents;

          // Utilisez les informations du groupe récupérées pour afficher les détails dans le composant
        });
      } else {
        // Récupérer les groupes existants dans la base de données
        const db = firebase.database();
        const projectGroupsRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups`);

        projectGroupsRef.once('value').then((snapshot) => {
          const groupPromises: Promise<void>[] = [];

          snapshot.forEach((childSnapshot) => {
            const group = childSnapshot.val();
            this.groupCards.push({
              id: childSnapshot.key,
              group: group.groupName,
              groupStatus: group.groupStatus || 0,
              students: group.students
            });
            const groupId = childSnapshot.key;
            if (groupId !== null) {
              groupPromises.push(this.checkGroupStatus(groupId));
            }
          });
          Promise.all(groupPromises).then(() => {
            this.showNewCard = this.groupCards.length === 0; // Afficher la carte "newCard" uniquement s'il n'y a aucun groupe créé
          });
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
          students,
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
      const groupId = newGroupRef.key;
      console.log('Nouveau groupe ajouté, ID:', groupId);

      newGroupRef
      .set({
        ...group,
        groupStatus: 0 // Initialiser le statut du groupe à 0 lors de l'ajout
      })
        .then(() => {
          console.log('Groupe ajouté au projet dans la base de données Firebase.');

          // Ajouter les étudiants au nœud "students" dans la base de données
          this.addStudentsToDatabase(groupId, group.students);

          console.log('Contenu du groupe :', group);

          // Ajouter le groupe à groupCards
          this.groupCards.push({
            id: groupId,
            group: group.groupName,
            groupStatus: 0,
            students: group.students
          });

          this.showNewCard = false; // Masquer la carte "newCard" après avoir créé un groupe
          this.checkGroupStatus(groupId); // Vérifier le statut du groupe créé
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

  addStudentsToDatabase(groupId: string, students: any[]) {
    const db = firebase.database();
    const groupStudentsRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${groupId}/students`);

    const studentsData: { [key: string]: any } = {}; // Utiliser un objet pour stocker les étudiants avec leurs studentId comme clés

    students.forEach((student) => {
      const studentId = uuidv4(); // Générer un nouvel ID unique pour chaque étudiant à l'aide de uuid
      const { prenom, nom } = student;

      studentsData[studentId] = {
        studentId: studentId,
        prenom: prenom,
        nom: nom,
        studentStatus: 0
      };
    });

    // Utiliser "set" pour ajouter l'objet studentsData à la base de données
    groupStudentsRef.set(studentsData)
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

        // Supposons que le prénom de l'étudiant est à l'index 0 et le nom à l'index 1 du tableau line
        const prenom = line[0].trim();
        const nom = line[1].trim();

        group.students.push({ prenom, nom });

        groups.push(group);
      }
    }

    return groups;
  }

  // Méthode pour la redirection vers la page de la liste des étudiants du groupe
  navigateToStudentList(groupId: string) {
    const url = `/teacher-home/${this.userId}/project/${this.projectId}/group/${groupId}/students`;
    this.router.navigate([url]);
  }

  checkGroupStatus(groupId: string): Promise<void> {
    console.log('Vérification du statut du groupe, ID:', groupId);

    if (!this.userId || !this.projectId || !groupId) {
      console.error("Impossible de vérifier le statut du groupe. Certaines informations manquent.");
      return Promise.resolve(); // Renvoyer une promesse résolue pour gérer le cas où les informations sont manquantes
    }

    // Accédez à la référence appropriée dans la base de données Firebase
    const db = firebase.database();
    const groupStatusRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups/${groupId}/groupStatus`);

    return new Promise<void>((resolve, reject) => {
      groupStatusRef.on(
        'value',
        snapshot => {
          const groupStatus = snapshot.val();
          console.log(`groupStatus pour le groupe ${groupId}:`, groupStatus);

          // Mettre à jour le statut du groupe dans groupCards
          const groupIndex = this.groupCards.findIndex(groupCard => groupCard.id === groupId);
          if (groupIndex !== -1) {
            this.groupCards[groupIndex].groupStatus = groupStatus;

            // Après la mise à jour du groupStatus, appelons la fonction pour mettre à jour le projectStatus
            this.updateProjectStatus()
              .then(() => {
                resolve(); // Résoudre la promesse une fois que tout est terminé
              })
              .catch((error) => {
                console.error("Erreur lors de la mise à jour du projectStatus:", error);
                reject(error);
              });
          } else {
            resolve();
          }
        },
        error => {
          console.error(`Erreur lors de la récupération du statut du groupe ${groupId}:`, error);
          reject(error); // Rejeter la promesse en cas d'erreur
        }
      );
    });
  }


  updateProjectStatus(): Promise<void> {
    // Vérifier si tous les groupStatus sont égaux à 1
    const allGroupsCompleted = this.groupCards.every(groupCard => groupCard.groupStatus === 1);

    if (!allGroupsCompleted) {
      return Promise.resolve(); // Renvoyer une promesse résolue si tous les groupes ne sont pas terminés
    }

    // Si tous les groupes sont terminés, mettre à jour le projectStatus du projet à 1
    const db = firebase.database();
    const projectStatusRef = db.ref(`users/${this.userId}/projects/${this.projectId}/projectStatus`);

    return new Promise<void>((resolve, reject) => {
      projectStatusRef.set(1)
        .then(() => {
          console.log('projectStatus du projet mis à jour à 1.');
          resolve();
        })
        .catch((error) => {
          console.error('Erreur lors de la mise à jour du projectStatus du projet:', error);
          reject(error);
        });
    });
  }


  getLightColor(groupStatus: number): string {
    return groupStatus === 1 ? 'green' : 'red';
  }

}

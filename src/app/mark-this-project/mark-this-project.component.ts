import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import firebase from 'firebase/compat/app';
import 'firebase/compat/auth';
import 'firebase/compat/database';
import { environment } from '../../environments/environment';

@Component({
  selector: 'app-mark-this-project',
  templateUrl: './mark-this-project.component.html',
  styleUrls: ['./mark-this-project.component.css']
})
export class MarkThisProjectComponent implements OnInit {
  userId: string = '';
  projectId: string = '';
  groups: any[] = [];

  constructor(private route: ActivatedRoute) {
    if (!firebase.apps.length) {
      firebase.initializeApp(environment.firebaseConfig);
    }
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.userId = params['userId'];
      this.projectId = params['projectId'];

      // Récupérer les groupes du projet à partir de la base de données Firebase
      const db = firebase.database();
      const projectGroupsRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups`);

      projectGroupsRef.once('value').then(snapshot => {
        this.groups = [];
        snapshot.forEach(childSnapshot => {
          const group = childSnapshot.val();
          this.groups.push({
            id: childSnapshot.key,
            groupName: group.groupName,
            groupStatus: group.groupStatus || 0,
            students: group.students,
            groupMark: 0 // Initialiser la note du groupe à 0 par défaut
          });
        });
      });
    });
  }

  saveMarks() {
    // Enregistrer les notes dans la base de données Firebase
    const db = firebase.database();
    const projectGroupsRef = db.ref(`users/${this.userId}/projects/${this.projectId}/groups`);

    this.groups.forEach(group => {
      const groupId = group.id;
      const groupMark = group.groupMark;

      projectGroupsRef.child(groupId).child('groupMark').set(groupMark);
    });

    console.log('Notes enregistrées avec succès !');
    // Vous pouvez ajouter un message de succès ou une redirection vers une autre page ici si nécessaire.
  }

}

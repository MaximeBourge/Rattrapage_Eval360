import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-tableau',
  templateUrl: './tableau.component.html',
  styleUrls: ['./tableau.component.css']
})
export class TableauComponent implements OnInit {
  groupId: string = '';

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

  // Déclaration des messages d'erreur
  noteResultatErrorMsg: string = '';
  noteObjectifErrorMsg: string = '';
  noteCompetenceErrorMsg: string = '';
  noteImplicationErrorMsg: string = '';
  noteCommunicationErrorMsg: string = '';

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.groupId = params['groupId'];
      // Effectuez les opérations nécessaires pour afficher le tableau du groupe correspondant
    });
  }

  onFormSubmit(): void {
    // Réinitialiser les messages d'erreur
    this.resetErrorMessages();

    // Valider les notes
    const validRange = { min: 0, max: 20 };

    if (!this.isNoteInRange(this.noteObjectif, validRange)) {
      this.noteObjectifErrorMsg = 'Veuillez entrer une note entre 0 et 20.';
    }

    if (!this.isNoteInRange(this.noteCompetence, validRange)) {
      this.noteCompetenceErrorMsg = 'Veuillez entrer une note entre 0 et 20.';
    }

    if (!this.isNoteInRange(this.noteImplication, validRange)) {
      this.noteImplicationErrorMsg = 'Veuillez entrer une note entre 0 et 20.';
    }

    if (!this.isNoteInRange(this.noteCommunication, validRange)) {
      this.noteCommunicationErrorMsg = 'Veuillez entrer une note entre 0 et 20.';
    }

    // Vérifier si des messages d'erreur sont présents
    if (
      this.noteObjectifErrorMsg ||
      this.noteCompetenceErrorMsg ||
      this.noteImplicationErrorMsg ||
      this.noteCommunicationErrorMsg
    ) {
      return;
    }

    // Calcul de la moyenne pondérée
    this.noteFinale = this.coeffResultat * this.noteResultat
      + this.coeffCompetence * this.noteCompetence
      + this.coeffImplication * this.noteImplication
      + this.coeffCommunication * this.noteCommunication;

    // Affichage des valeurs (pour débogage)
    console.log('Communication:', this.noteCommunication);
    console.log('Compétence:', this.noteCompetence);
    console.log('Implication:', this.noteImplication);
    console.log('Résultat/Objectif:', this.noteResultat);
    console.log('NoteFinale', this.noteFinale);
  }

  // Vérifier si la note est dans la plage autorisée
  isNoteInRange(note: number, range: { min: number, max: number }): boolean {
    return note >= range.min && note <= range.max;
  }

  // Réinitialiser les messages d'erreur
  resetErrorMessages(): void {
    this.noteResultatErrorMsg = '';
    this.noteObjectifErrorMsg = '';
    this.noteCompetenceErrorMsg = '';
    this.noteImplicationErrorMsg = '';
    this.noteCommunicationErrorMsg = '';
  }

  // Vérifier si une note est manquante
  isNoteMissing(): boolean {
    return (
      this.noteObjectif === 0 ||
      this.noteCompetence === 0 ||
      this.noteImplication === 0 ||
      this.noteCommunication === 0
    );
  }
}

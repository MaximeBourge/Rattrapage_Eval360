import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-tableau',
  templateUrl: './tableau.component.html',
  styleUrls: ['./tableau.component.css']
})
export class TableauComponent implements OnInit {
  groupId: string = '';

  constructor(private route: ActivatedRoute) { }

  ngOnInit(): void {
    this.route.params.subscribe((params) => {
      this.groupId = params['groupId']; // Récupère l'ID du groupe à partir des paramètres de route
      // Effectuez les opérations nécessaires pour afficher le tableau du groupe correspondant
    });
  }

  onFormSubmit(): void {
    /*const communicationInput = document.querySelector('input[name="communication"]') as HTMLInputElement;
    this.communication = Number(communicationInput.value);

    const competenceInput = document.querySelector('input[name="competence"]') as HTMLInputElement;
    this.competence = Number(competenceInput.value);

    const implicationInput = document.querySelector('input[name="implication"]') as HTMLInputElement;
    this.implication = Number(implicationInput.value);

    const resultatInput = document.querySelector('input[name="resultat"]') as HTMLInputElement;
    this.resultat = Number(resultatInput.value);

    // Calcul de la moyenne pondérée
    this.noteFinale = this.coeffResultat * this.resultat
      + this.coeffCompetence * this.competence
      + this.coeffImplication * this.implication
      + this.coeffCommunication * this.communication;

    console.log('Communication:', this.communication);
    console.log('Compétence:', this.competence);
    console.log('Implication:', this.implication);
    console.log('Résultat/Objectif:', this.resultat);
    console.log('NoteFinale', this.noteFinale);
  }

  goBack(): void {
    window.history.back();
  }
  */
}
}

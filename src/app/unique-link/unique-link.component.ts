import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import * as CryptoJS from 'crypto-js';

@Component({
  selector: 'app-unique-link',
  templateUrl: './unique-link.component.html',
  styleUrls: ['./unique-link.component.css']
})
export class UniqueLinkComponent implements OnInit {

  constructor(private route: ActivatedRoute, private router: Router) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const uniqueLink = params['uniqueLink'];
      const decryptedData = this.decryptUniqueLink(uniqueLink);

      // Redirigez vers le composant "TableauComponent" avec les informations décryptées
      this.router.navigate(['/tableau', decryptedData]);
    });
  }

  decryptUniqueLink(uniqueLink: string): any {
    // Décodez les valeurs en base64
    const decryptedUserId = CryptoJS.AES.decrypt(atob(uniqueLink), 'votre_clé_de_chiffrement').toString(CryptoJS.enc.Utf8);
    // Décodez d'autres informations si nécessaire...

    // Retournez les informations décryptées sous forme d'objet
    return {
      userId: decryptedUserId,
      // Autres informations décryptées...
    };
  }
}

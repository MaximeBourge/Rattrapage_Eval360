export function generateExampleCSV(): string {
  const csvHeader = 'Nom,Prenom,Adresse mail,Annee,Filiere\n';

  const csvData = 'Doe,John,john.doe@isen.yncrea.fr,2eme,Informatique\n' +
                  'Smith,Jane,jane.smith@isen.yncrea.fr,3eme,Physique\n' +
                  'Johnson,Mark,mark.johnson@isen.yncrea.fr,1ere,Chimie\n';

  return csvHeader + csvData;
}

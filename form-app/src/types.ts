export interface FormData {
  athleteFullName: string;
  guardianFullName: string;
  phoneWhatsapp: string;
  email: string;
  serviceType: 'Fotos de la presentación' | 'Fotos de la presentación + retratos' | '';
  packageName: 'Individual' | 'Familiar x 2' | 'Multielemento x 2' | 'Familiar x 3' | 'Multielemento x 3' | '';
  delivery: 'Entrega Estándar' | 'Entrega Prioritaria' | 'Entrega Inmediata' | '';
  pixieset: 'Sí' | 'No' | '';
  academyGroupClub: string;
  observations: string;
}

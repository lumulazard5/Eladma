import { jsPDF } from 'jspdf';

interface ContractData {
  companyName: string;
  location: string;
  date: string;
  signature: string; // base64 data uri
}

export const generateContractPDF = async (data: ContractData): Promise<Blob> => {
  const doc = new jsPDF();
  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Header
  doc.setFontSize(22);
  doc.setTextColor(0, 100, 80); // Emerald color
  doc.text('ELADMA INC.', margin, 30);
  
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text('Siège Social : Kananga/C, Ngaza', margin, 35);
  doc.text('République Démocratique du Congo', margin, 40);
  doc.text('contact@eladma.com', margin, 45);

  // Title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('CONTRAT DE DISTRIBUTION ET DE PARTENARIAT', pageWidth / 2, 65, { align: 'center' });
  doc.line(margin, 70, pageWidth - margin, 70);

  // Content
  doc.setFontSize(11);
  doc.text(`Entre : ELADMA INC., ci-après dénommée "La Plateforme"`, margin, 85);
  doc.text(`Et : ${data.companyName}, sis à ${data.location}, ci-après dénommé "Le Prestataire"`, margin, 92);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('1. OBJET', margin, 110);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Le présent contrat définit les conditions dans lesquelles le Prestataire utilise les services d\'Eladma pour la vente, la promotion et la distribution de ses produits artisanaux ou manufacturés.', margin, 118, { maxWidth: pageWidth - 40 });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('2. COMMISSIONS ET PAIEMENTS', margin, 135);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Eladma prélève une commission fixe de 8% sur le prix de vente final. Les paiements sont reversés au Prestataire tous les mardis pour les ventes finalisées de la semaine précédente.', margin, 143, { maxWidth: pageWidth - 40 });

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('3. ENGAGEMENTS LOGISTIQUES', margin, 160);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Le Prestataire s\'engage à préparer les commandes sous 24h. Pour les artisans du Kasaï Central, Eladma assure la collecte et l\'expédition internationale depuis son hub de Kananga.', margin, 168, { maxWidth: pageWidth - 40 });

  // Signature Section
  const signatureY = 210;
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('SIGNATURES', margin, signatureY);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Fait à Kananga (RDC),', margin, signatureY + 10);
  doc.text(`Le ${data.date}`, margin, signatureY + 15);

  // Add the signature image
  try {
    doc.addImage(data.signature, 'PNG', margin, signatureY + 20, 60, 30);
  } catch (e) {
    console.error('Could not add signature to PDF', e);
  }

  doc.text('Signature certifiée Eladma', margin + 5, signatureY + 55);
  doc.line(margin, signatureY + 52, margin + 60, signatureY + 52);

  return doc.output('blob');
};

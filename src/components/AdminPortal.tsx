import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShieldCheck, 
  Settings, 
  Users, 
  Scale, 
  ArrowLeft, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Fingerprint, 
  FileText, 
  Eye, 
  UserCheck, 
  Plus, 
  X, 
  Check, 
  Camera, 
  Scale as ScaleIcon, 
  Lock, 
  Unlock, 
  MapPin, 
  ShieldAlert, 
  Database, 
  RefreshCcw,
  Download,
  Upload,
  Search,
  Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useCurrency } from '../context/CurrencyContext';
import { haptics } from '../services/haptics';
import { sounds } from '../services/sound';
import { EladmaSecurity } from '../services/security';

const ROLE_PERMISSIONS: Record<string, {
  roleName: string;
  description: string;
  canViewDashboard: boolean;
  canModeratePartners: boolean;
  canManageSiteConfig: boolean;
  canManageStaff: boolean;
  label: string;
}> = {
  'Super-Administrateur Général (Directeur RDC)': {
    roleName: 'Super-Administrateur Général (Directeur RDC)',
    description: "Accès souverain total sur l'ensemble des configurations, droits d'audit, et de la sécurité.",
    canViewDashboard: true,
    canModeratePartners: true,
    canManageSiteConfig: true,
    canManageStaff: true,
    label: 'Super-Admin'
  },
  'Chef de la Conformité Juridique': {
    roleName: 'Chef de la Conformité Juridique',
    description: 'Régule et valide le volet juridique et légal ainsi que la conformité des dossiers partenaires.',
    canViewDashboard: true,
    canModeratePartners: true,
    canManageSiteConfig: true,
    canManageStaff: false,
    label: 'Conformité'
  },
  'Modératrice Provinciale (Kananga)': {
    roleName: 'Modératrice Provinciale (Kananga)',
    description: "Modère et instruit les candidatures locales. Pas d'accès aux politiques globales de l'État.",
    canViewDashboard: true,
    canModeratePartners: true,
    canManageSiteConfig: false,
    canManageStaff: false,
    label: 'Modératrice'
  },
  'Auditeur de Documents par Vision IA': {
    roleName: 'Auditeur de Documents par Vision IA',
    description: 'Pré-analyse automatisée par ordinateur des pièces justificatives téléversées.',
    canViewDashboard: true,
    canModeratePartners: true,
    canManageSiteConfig: false,
    canManageStaff: false,
    label: 'Vision IA'
  },
  'Inspecteur de Conformité': {
    roleName: 'Inspecteur de Conformité',
    description: "Vérifie les cartes d'électeurs et les RCCM officiels des commerçants de la province.",
    canViewDashboard: true,
    canModeratePartners: true,
    canManageSiteConfig: false,
    canManageStaff: false,
    label: 'Inspecteur'
  },
  'Auditeur Financier MobileMoney': {
    roleName: 'Auditeur Financier MobileMoney',
    description: 'Examine les grands livres, virements de fonds Mobiles, sans modifier la constitution du site.',
    canViewDashboard: true,
    canModeratePartners: false,
    canManageSiteConfig: false,
    canManageStaff: false,
    label: 'Auditeur Fin.'
  },
  'Lecteur / Observateur': {
    roleName: 'Lecteur / Observateur',
    description: "Accès de consultation en lecture seule sur l'ensemble des modules d'administration.",
    canViewDashboard: true,
    canModeratePartners: false,
    canManageSiteConfig: false,
    canManageStaff: false,
    label: 'Lecteur / Viewer'
  }
};

interface AdminPortalProps {
  onBack: () => void;
}

export const AdminPortal: React.FC<AdminPortalProps> = ({ onBack }) => {
  const { formatPrice } = useCurrency();
  const [activeTab, setActiveTab] = useState<'status_sandbox' | 'partner_audit' | 'site_config' | 'admin_accounts' | 'security_logs'>('status_sandbox');

  // Administrator accounts list
  const [adminAccounts, setAdminAccounts] = useState<{ id: string; name: string; email: string; role: string; status: 'active' | 'inactive'; joined: string }[]>(() => {
    try {
      const saved = localStorage.getItem('eladma-admin-accounts-list');
      if (saved) return JSON.parse(saved);
    } catch {}
    return [
      { id: 'admin-1', name: 'Lazard Lumu', email: 'lumulazard5@gmail.com', role: 'Super-Administrateur Général (Directeur RDC)', status: 'active', joined: '12/03/2026' },
      { id: 'admin-2', name: 'Dr. Martin Mukendi', email: 'm.mukendi@eladma.com', role: 'Chef de la Conformité Juridique', status: 'active', joined: '28/04/2026' },
      { id: 'admin-3', name: 'Sifa Kalala', email: 's.kalala@eladma.org', role: 'Modératrice Provinciale (Kananga)', status: 'active', joined: '10/05/2026' },
      { id: 'admin-4', name: 'Audit Robot IA', email: 'ai.auditor@eladma.com', role: 'Auditeur de Documents par Vision IA', status: 'active', joined: '20/05/2026' },
    ];
  });

  const activeAdminEmail = sessionStorage.getItem('eladma_active_admin_email') || 'lumulazard5@gmail.com';

  const currentAccount = useMemo(() => {
    return adminAccounts.find(a => a.email === activeAdminEmail) || adminAccounts[0] || {
      id: 'admin-1',
      name: 'Lazard Lumu',
      email: 'lumulazard5@gmail.com',
      role: 'Super-Administrateur Général (Directeur RDC)',
      status: 'active' as const,
      joined: '12/03/2026'
    };
  }, [adminAccounts, activeAdminEmail]);

  // Search & Filters for Staff registry interface
  const [staffSearchQuery, setStaffSearchQuery] = useState('');
  const [staffRoleFilter, setStaffRoleFilter] = useState('all');

  const filteredStaff = useMemo(() => {
    return adminAccounts.filter(account => {
      const matchesSearch = 
        account.name.toLowerCase().includes(staffSearchQuery.toLowerCase()) || 
        account.email.toLowerCase().includes(staffSearchQuery.toLowerCase());
      const matchesRole = staffRoleFilter === 'all' || account.role === staffRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [adminAccounts, staffSearchQuery, staffRoleFilter]);

  const currentPermissions = useMemo(() => {
    const roleName = currentAccount?.role || 'Lecteur / Observateur';
    return ROLE_PERMISSIONS[roleName] || ROLE_PERMISSIONS['Lecteur / Observateur'];
  }, [currentAccount]);

  const handleUpdateAdminRole = (id: string, newRole: string) => {
    if (!currentPermissions.canManageStaff) {
      toast.error("🔒 Droits régaliens requis", { 
        description: "Seul un Super-Administrateur Général peut attribuer de nouveaux rôles opérationnels." 
      });
      return;
    }
    if (id === 'admin-1' && newRole !== 'Super-Administrateur Général (Directeur RDC)') {
      toast.error("Action verrouillée", { 
        description: "Le Super-Administrateur d'origine (Directeur de session) ne peut pas être rétrogradé." 
      });
      return;
    }
    const updated = adminAccounts.map(a => a.id === id ? { ...a, role: newRole } : a);
    setAdminAccounts(updated);
    localStorage.setItem('eladma-admin-accounts-list', JSON.stringify(updated));
    haptics.success();
    sounds.success();
    toast.success("Rôle d'administration mis à jour !", {
      description: `Le personnel a été réassigné en tant que "${newRole}".`
    });
  };

  const handleExportStaff = () => {
    try {
      const dataStr = JSON.stringify(adminAccounts, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', url);
      linkElement.setAttribute('download', `eladma_staff_config_${new Date().toISOString().slice(0, 10)}.json`);
      linkElement.click();
      URL.revokeObjectURL(url);
      
      sounds.success();
      haptics.success();
      toast.success("Succès de l'exportation", {
        description: "La configuration du personnel a été téléchargée au format JSON."
      });
    } catch (e) {
      toast.error("Erreur lors de l'exportation");
    }
  };

  const handleImportStaff = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!currentPermissions.canManageStaff) {
      toast.error("🔒 Droits d'écriture requis", {
        description: "Seul un Super-Administrateur Général peut restaurer ou migrer la configuration d'accréditation du personnel."
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        
        // Validate elements of the imported array
        if (!Array.isArray(parsed)) {
          throw new Error("Le fichier JSON doit contenir une liste d'utilisateurs.");
        }
        
        const validated = parsed.filter(item => {
          return item && typeof item === 'object' && typeof item.name === 'string' && typeof item.email === 'string' && typeof item.role === 'string';
        }).map((item, idx) => ({
          id: item.id || `imported-${Date.now()}-${idx}`,
          name: item.name,
          email: item.email,
          role: ROLE_PERMISSIONS[item.role] ? item.role : 'Lecteur / Observateur',
          status: item.status === 'active' || item.status === 'inactive' ? item.status : ('active' as const),
          joined: item.joined || new Date().toLocaleDateString('fr-FR'),
        }));

        if (validated.length === 0) {
          throw new Error("Aucun administrateur valide trouvé dans le fichier.");
        }

        // Validate that there's at least one Super-Admin
        const hasSuperAdmin = validated.some(a => a.role === 'Super-Administrateur Général (Directeur RDC)');
        if (!hasSuperAdmin) {
          // Keep at least the original Super-Admin if none in validated
          const originalSuper = adminAccounts.find(a => a.id === 'admin-1');
          if (originalSuper) {
            validated.unshift(originalSuper);
          }
        }

        setAdminAccounts(validated);
        localStorage.setItem('eladma-admin-accounts-list', JSON.stringify(validated));
        
        sounds.success();
        haptics.success();
        toast.success("Importation réussie ✅", {
          description: `${validated.length} comptes d'administration configurés avec succès.`
        });
        
        // Reset the file input value so same file can be imported again
        e.target.value = '';
      } catch (err: any) {
        sounds.error();
        toast.error("Fichier d'importation invalide", {
          description: err.message || "Impossible de décoder le fichier JSON."
        });
      }
    };
    reader.readAsText(file);
  };

  // Real-time local verification status synced with SupplierDashboard
  const [verificationStatus, setVerificationStatus] = useState<'unregistered' | 'pending' | 'verified'>(() => {
    const saved = localStorage.getItem('eladma-supplier-status');
    return (saved as any) || 'unregistered';
  });

  const [companyName, setCompanyName] = useState(() => localStorage.getItem('eladma-supplier-company') || '');
  const [addressStreet, setAddressStreet] = useState(() => localStorage.getItem('eladma-supplier-street') || '');
  const [addressNumber, setAddressNumber] = useState(() => localStorage.getItem('eladma-supplier-number') || '');
  const [addressNeighborhood, setAddressNeighborhood] = useState(() => localStorage.getItem('eladma-supplier-neighborhood') || '');
  const [addressCommune, setAddressCommune] = useState(() => localStorage.getItem('eladma-supplier-commune') || '');
  const [addressCity, setAddressCity] = useState(() => localStorage.getItem('eladma-supplier-city') || 'Kananga');
  const [addressProvince, setAddressProvince] = useState(() => localStorage.getItem('eladma-supplier-province') || 'Kasaï-Central');

  // Site general configurations
  const [siteName, setSiteName] = useState(() => localStorage.getItem('eladma-site-name') || 'Eladma RDC');
  const [siteAnnouncement, setSiteAnnouncement] = useState(() => localStorage.getItem('eladma-site-announcement') || '🚀 Bienvenue sur la première marketplace inclusive de la RDC ! Services financiers MPesa & Rawbank intégrés.');
  const [siteContactEmail, setSiteContactEmail] = useState(() => localStorage.getItem('eladma-site-contact-email') || 'eladmastore@gmail.com');
  const [siteContactPhone, setSiteContactPhone] = useState(() => localStorage.getItem('eladma-site-contact-phone') || '+243 821 234 567');

  // Interactive Policy Overrides State
  const [policyShipping, setPolicyShipping] = useState(() => localStorage.getItem('eladma-policy-override-shipping') || '');
  const [policyRefund, setPolicyRefund] = useState(() => localStorage.getItem('eladma-policy-override-refund') || '');
  const [policyTerms, setPolicyTerms] = useState(() => localStorage.getItem('eladma-policy-override-terms') || '');
  const [policyPrivacy, setPolicyPrivacy] = useState(() => localStorage.getItem('eladma-policy-override-privacy') || '');

  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState('Inspecteur de Conformité');

  // Audit Inspecting doc states
  const [inspectingDoc, setInspectingDoc] = useState<{ title: string; content: string; file: string } | null>(null);

  // Database of applicant queues
  const [partnerApplicants, setPartnerApplicants] = useState<{
    id: string;
    company: string;
    city: string;
    province: string;
    address: string;
    status: 'pending' | 'verified' | 'rejected';
    selfie: string;
    documents: { id: string; name: string; size: string; title: string; check: boolean; content: string }[];
    signature: string;
  }[]>(() => {
    return [
      {
        id: 'app-self',
        company: companyName || "Coopérative Eladma (Votre Session)",
        city: addressCity || "Kananga",
        province: addressProvince || "Kasaï-Central",
        address: `${addressNumber || '45'}, Avenue ${addressStreet || 'Tshinsele'}, Quartier ${addressNeighborhood || 'Salongo'}, Commune de ${addressCommune || 'Luiza'}, Ville de ${addressCity || 'Luiza'}, ${addressProvince || 'Kasaï-Central'}`,
        status: verificationStatus as any,
        selfie: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        documents: [
          { 
            id: 'id-1', 
            name: 'CNI_Gerant_Officiel.pdf', 
            size: '1.2 MB', 
            title: "Pièce d'identité du gérant", 
            check: true,
            content: `RÉPUBLIQUE DÉMOCRATIQUE DU CONGO\nCARTE D'ÉLECTEUR / D'IDENTITÉ PROVISOIRE\n\nN° National : RDC-903423-H\nNom : TOUT-VENANT\nPrénom : MARCHANT\nNationalité : Congolaise\nLieu de naissance : Kananga\n\n[Statut : Validé par reconnaissance faciale]` 
          },
          { 
            id: 'reg-1', 
            name: 'Registre_RCCM_Validation_Eladma.pdf', 
            size: '2.4 MB', 
            title: "Registre de Commerce (RCCM)", 
            check: true,
            content: `GREFFE DU TRIBUNAL DE COMMERCE DE KANANGA\nREGISTRE DU COMMERCE ET DU CRÉDIT MOBILIER (RCCM)\n\nNuméro d'immatriculation : CD/KAN/RCCM/26-B-0421\n\nDénomination sociale : ${companyName || 'Coopérative Eladma'}\nForme juridique : Société Coopérative\nActivité : Commerce général.` 
          },
          { 
            id: 'tax-1', 
            name: 'Attestation_Fiscale_2026.pdf', 
            size: '850 KB', 
            title: "Attestation Fiscale", 
            check: true,
            content: `DIRECTION GÉNÉRALE DES IMPÔTS (DGI)\nCENTRE DES IMPÔTS SYNTHÉTIQUES DE KANANGA\n\nATTESTATION DE RÉGULARITÉ FISCALE` 
          }
        ],
        signature: "true"
      },
      {
        id: 'app-1',
        company: "Huilerie Coopérative de Demba",
        city: "Demba",
        province: "Kasaï-Central",
        address: "78, Avenue Lumumba, Quartier Commercial, Commune de Demba",
        status: 'pending',
        selfie: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80",
        documents: [
          { 
            id: 'id-2', 
            name: 'ID_Ngalula_Gerante.pdf', 
            size: '1.4 MB', 
            title: "Pièce d'identité du gérant", 
            check: true,
            content: "RÉPUBLIQUE DÉMOCRATIQUE DU CONGO\nNom: Ngalula\nPrénom: Marie\nLieu: Demba" 
          },
          { 
            id: 'reg-2', 
            name: 'RCCM_DEMBA_COOP.pdf', 
            size: '1.9 MB', 
            title: "Registre de Commerce (RCCM)", 
            check: false,
            content: "TRIBUNAL DE COMMERCE DE KANANGA\nRCCM/Num: CD/KAN/RCCM/26-B-0912\nHuilerie Artisanal de Palmes" 
          }
        ],
        signature: "true"
      },
      {
        id: 'app-2',
        company: "Sculpteurs Uni d'Art Kananga",
        city: "Kananga",
        province: "Kasaï-Central",
        address: "12, Boulevard du 30 Juin, Commune de Katoka, Ville de Kananga",
        status: 'verified',
        selfie: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80",
        documents: [
          { 
            id: 'id-3', 
            name: 'CNI_Mukendi_Sculpteur.pdf', 
            size: '1.1 MB', 
            title: "Pièce d'identité du gérant", 
            check: true,
            content: "REGISTRE CONGOLAIS\nNom: Mukendi\nPrénom: Jean\nProfession: Sculpteur d'art" 
          }
        ],
        signature: "true"
      }
    ];
  });

  const [auditedApplicantId, setAuditedApplicantId] = useState<string>('app-self');

  // Security logs state (fetched from local security service)
  const [securityThreats, setSecurityThreats] = useState<any[]>(() => {
    return EladmaSecurity.getThreatLogs();
  });

  useEffect(() => {
    const handleSecUpdate = () => {
      setSecurityThreats(EladmaSecurity.getThreatLogs());
    };
    window.addEventListener('storage', handleSecUpdate);
    // Custom trigger from logThreat function
    const interval = setInterval(handleSecUpdate, 2000);
    return () => {
      window.removeEventListener('storage', handleSecUpdate);
      clearInterval(interval);
    };
  }, []);

  const selectedApplicant = useMemo(() => {
    if (auditedApplicantId === 'app-self') {
      return {
        id: 'app-self',
        company: companyName || "Votre Coopérative Locale",
        city: addressCity || "Luiza/Kananga",
        province: addressProvince || "Kasaï-Central",
        address: `${addressNumber || '45'}, Avenue ${addressStreet || 'Tshinsele'}, Quartier ${addressNeighborhood || 'Salongo'}, Commune de ${addressCommune || 'Luiza'}, Ville de ${addressCity || 'Luiza'}, ${addressProvince || 'Kasaï-Central'}`,
        status: verificationStatus,
        selfie: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
        documents: [
          { 
            id: 'id-1', 
            name: 'CNI_Gerant_Officiel.pdf', 
            size: '1.2 MB', 
            title: "Pièce d'identité du gérant", 
            check: true,
            content: `RÉPUBLIQUE DÉMOCRATIQUE DU CONGO\nCARTE D'ÉLECTEUR / D'IDENTITÉ PROVISOIRE\n\nN° National : RDC-903423-H\nNom : TOUT-VENANT\nPrénom : MARCHANT\nNationalité : Congolaise\nLieu de naissance : Kananga\n\n[Statut : Validé avec succès par biométrie faciale]` 
          },
          { 
            id: 'reg-1', 
            name: 'Registre_RCCM_Validation_Eladma.pdf', 
            size: '2.4 MB', 
            title: "Registre de Commerce (RCCM)", 
            check: true,
            content: `GREFFE DU TRIBUNAL DE COMMERCE DE KANANGA\nREGISTRE DU COMMERCE ET DU CRÉDIT MOBILIER (RCCM)\n\nNuméro d'immatriculation : CD/KAN/RCCM/26-B-0421\n\nDénomination sociale : ${companyName || 'Coopérative Eladma'}\nForme juridique : Société Coopérative\nActivité : Commerce de détail d'artisanat régional.` 
          },
          { 
            id: 'tax-1', 
            name: 'Attestation_Fiscale_2026.pdf', 
            size: '850 KB', 
            title: "Attestation Fiscale", 
            check: true,
            content: `DIRECTION GÉNÉRALE DES IMPÔTS (DGI)\nCENTRE DES IMPÔTS SYNTHÉTIQUES DE KANANGA\n\nATTESTATION DE RÉGULARITÉ FISCALE` 
          }
        ],
        signature: "true"
      };
    }
    return partnerApplicants.find(a => a.id === auditedApplicantId) || partnerApplicants[0];
  }, [auditedApplicantId, partnerApplicants, companyName, addressCity, addressProvince, addressNumber, addressStreet, addressNeighborhood, addressCommune, verificationStatus]);

  // Handle status sandbox change
  const handleUpdateStatus = (status: 'unregistered' | 'pending' | 'verified') => {
    setVerificationStatus(status);
    localStorage.setItem('eladma-supplier-status', status);
    
    if (status !== 'unregistered' && !companyName) {
      setCompanyName('Coopérative Artisanale de Luiza');
      localStorage.setItem('eladma-supplier-company', 'Coopérative Artisanale de Luiza');
    }

    if (!addressStreet) {
      setAddressStreet('Tshinsele');
      setAddressNumber('45');
      setAddressNeighborhood('Salongo');
      setAddressCommune('Luiza');
      setAddressCity('Luiza');
      setAddressProvince('Kasaï-Central');

      localStorage.setItem('eladma-supplier-street', 'Tshinsele');
      localStorage.setItem('eladma-supplier-number', '45');
      localStorage.setItem('eladma-supplier-neighborhood', 'Salongo');
      localStorage.setItem('eladma-supplier-commune', 'Luiza');
      localStorage.setItem('eladma-supplier-city', 'Luiza');
      localStorage.setItem('eladma-supplier-province', 'Kasaï-Central');
    }

    toast.success("Rôle global configuré", {
      description: `Rôle basculé vers : ${
        status === 'unregistered' ? 'Nouveau Candidat' :
        status === 'pending' ? 'Audit d\'Homologation' : 'Super-Admin Certifié'
      }`
    });
  };

  // Approve audited candidate
  const handleApproveApplicant = (id: string) => {
    if (!currentPermissions.canModeratePartners) {
      toast.error("🔒 Action interdite - Privilèges insuffisants", {
        description: `Votre rôle de "${currentAccount?.role || 'Lecteur'}" est en lecture seule et ne permet pas d'approuver de dossiers.`
      });
      return;
    }
    haptics.success();
    sounds.success();
    if (id === 'app-self') {
      handleUpdateStatus('verified');
    } else {
      setPartnerApplicants(prev => prev.map(a => a.id === id ? { ...a, status: 'verified' } : a));
    }
    toast.success("Dossier juridique approuvé !", {
      description: "Le partenaire reçoit ses accréditations de vente et le badge de Marchand Certifié."
    });
  };

  // Reject audited candidate
  const handleRejectApplicant = (id: string) => {
    if (!currentPermissions.canModeratePartners) {
      toast.error("🔒 Action interdite - Privilèges insuffisants", {
        description: `Votre rôle de "${currentAccount?.role || 'Lecteur'}" est en lecture seule et ne permet pas de rejeter des dossiers.`
      });
      return;
    }
    haptics.warning();
    sounds.warning();
    if (id === 'app-self') {
      handleUpdateStatus('unregistered');
    } else {
      setPartnerApplicants(prev => prev.map(a => a.id === id ? { ...a, status: 'rejected' } : a));
    }
    toast.error("Dossier rejeté par l'inspecteur", {
      description: "L'artisan sera notifié de compléter sa documentation juridique manquante."
    });
  };

  // Save general options
  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPermissions.canManageSiteConfig) {
      toast.error("🔒 Action interdite - Privilèges insuffisants", {
        description: `Votre rôle de "${currentAccount?.role || 'Lecteur'}" n'autorise pas la modification des paramètres généraux.`
      });
      return;
    }
    localStorage.setItem('eladma-site-name', siteName);
    localStorage.setItem('eladma-site-announcement', siteAnnouncement);
    localStorage.setItem('eladma-site-contact-email', siteContactEmail);
    localStorage.setItem('eladma-site-contact-phone', siteContactPhone);
    haptics.medium();
    sounds.success();
    toast.success("Options Eladma RDC enregistrées.");
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPermissions.canManageSiteConfig) {
      toast.error("🔒 Action interdite - Privilèges insuffisants", {
        description: `Votre rôle de "${currentAccount?.role || 'Lecteur'}" n'autorise pas la modification des textes législatifs.`
      });
      return;
    }
    localStorage.setItem('eladma-policy-override-shipping', policyShipping);
    localStorage.setItem('eladma-policy-override-refund', policyRefund);
    localStorage.setItem('eladma-policy-override-terms', policyTerms);
    localStorage.setItem('eladma-policy-override-privacy', policyPrivacy);
    haptics.medium();
    sounds.success();
    toast.success("Politiques légales de la plateforme mises à jour !");
  };

  // Admin personnel management
  const handleAddAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPermissions.canManageStaff) {
      toast.error("🔒 Action interdite - Privilèges insuffisants", {
        description: `Seul le Super-Administrateur Général peut accréditer de nouveaux agents d'État.`
      });
      return;
    }
    if (!newAdminName || !newAdminEmail) return;

    const newAdmin = {
      id: `admin-${Date.now()}`,
      name: newAdminName,
      email: newAdminEmail,
      role: newAdminRole,
      status: 'active' as const,
      joined: new Date().toLocaleDateString('fr-FR')
    };

    const updated = [...adminAccounts, newAdmin];
    setAdminAccounts(updated);
    localStorage.setItem('eladma-admin-accounts-list', JSON.stringify(updated));

    setNewAdminName('');
    setNewAdminEmail('');
    haptics.success();
    sounds.success();
    toast.success("Nouvel inspecteur ajouté au personnel");
  };

  const handleDeleteAdmin = (id: string) => {
    if (!currentPermissions.canManageStaff) {
      toast.error("🔒 Action interdite - Privilèges insuffisants", {
        description: `Seul le Super-Administrateur Général peut révoquer des accréditations d'État.`
      });
      return;
    }
    if (id === 'admin-1') {
      toast.error("Action impossible", { description: "Le Super-Admin d'origine de la session ne peut pas être révoqué." });
      return;
    }
    const updated = adminAccounts.filter(a => a.id !== id);
    setAdminAccounts(updated);
    localStorage.setItem('eladma-admin-accounts-list', JSON.stringify(updated));
    haptics.warning();
    sounds.warning();
    toast.success("Accreditations admin révoquées définitivement.");
  };

  const threatCountSummary = useMemo(() => {
    return securityThreats.length;
  }, [securityThreats]);

  const clearSecurityLogs = () => {
    EladmaSecurity.clearThreatLogs();
    setSecurityThreats([]);
    toast.success("Journaux de menaces de l'AntiCloningSentinel nettoyés.");
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-black p-4 md:p-8">
      <div className="max-w-7xl mx-auto pb-24">
        
        {/* Sovereign Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <button 
              onClick={onBack}
              className="flex items-center gap-2 text-zinc-500 hover:text-brand transition-colors group text-sm font-bold"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              Retour boutique
            </button>
            <h1 className="text-3xl font-black dark:text-white mt-3 flex items-center gap-2.5">
              <ShieldCheck className="w-8 h-8 text-brand" />
              Portail d'Administration Souverain
            </h1>
            <p className="text-xs text-zinc-500 mt-1">
              Console confidentielle de régulation de la marketplace exclusive d'Eladma RDC
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2.5 px-3.5 py-2 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-2xl shadow-sm text-xs">
              <div className="w-6 h-6 bg-brand/15 text-brand rounded-full flex items-center justify-center font-bold text-[10px]">
                {currentAccount.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="text-left font-semibold">
                <p className="dark:text-white leading-none text-[11px] font-black">{currentAccount.name}</p>
                <p className="text-[9px] text-zinc-500 leading-none mt-0.5">{currentPermissions.roleName}</p>
              </div>
              <span className="ml-1 px-1.5 py-0.5 bg-brand text-white rounded text-[8px] font-black uppercase tracking-wider">
                {currentPermissions.label}
              </span>
            </div>

            <span className="text-xs text-zinc-600 dark:text-zinc-400 font-extrabold flex items-center gap-1.5 px-3.5 py-2 bg-zinc-100 dark:bg-zinc-900 rounded-full border dark:border-zinc-805 uppercase tracking-wider">
              <Database className="w-3.5 h-3.5 text-brand" /> Serveurs KANANGA
            </span>
          </div>
        </div>

        {/* Separated Navigation Tabs exclusively for administrators */}
        <div className="flex gap-2 p-1 bg-zinc-200/50 dark:bg-zinc-900/50 rounded-2xl w-fit mb-8 overflow-x-auto max-w-full">
          {[
            { id: 'status_sandbox', label: "Sandbox & Rôles 🧪", icon: Fingerprint },
            { id: 'partner_audit', label: "Audit Candidats 🛡️", icon: Scale },
            { id: 'site_config', label: "Paramètres Globaux ⚙️", icon: Settings },
            { id: 'admin_accounts', label: "Personnel de l'État 👥", icon: Users },
            { id: 'security_logs', label: `Sécurité & Anti-Cloning (${threatCountSummary}) 🚨`, icon: ShieldAlert },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                haptics.light();
                sounds.click();
                setActiveTab(tab.id as any);
              }}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all whitespace-nowrap relative ${
                activeTab === tab.id 
                  ? 'bg-white dark:bg-zinc-800 text-brand shadow-sm font-black scale-102' 
                  : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
              }`}
            >
              <tab.icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
              {tab.id === 'partner_audit' && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-brand text-[10px] font-black text-white animate-pulse">
                  1
                </span>
              )}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* TAP: Sandbox simulator */}
          {activeTab === 'status_sandbox' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="bg-zinc-900 border border-zinc-800 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 text-white/5 pointer-events-none">
                  <Fingerprint className="w-48 h-48 rotate-12" />
                </div>

                <div className="relative z-10 space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] bg-brand text-white font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      Configuration Sandbox
                    </span>
                    <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Statut d'homologation artisan simulé
                    </span>
                  </div>

                  <h3 className="text-2xl font-black text-white">Réguler le statut de votre espace vendeur</h3>
                  <p className="text-sm text-zinc-400 max-w-4xl leading-relaxed">
                    Le portail administrateur est désormais <strong>entièrement ségrégé</strong> et physiquement séparé de l'Espace des artisans locaux/vendeurs. Un vendeur normal visitant le site n'a aucun moyen d'accéder à ce panneau de contrôle ni d'auditer les dossiers.
                    Utilisez les interrupteurs ci-dessous pour simuler les différents rôles opérationnels du système pour votre compte de test :
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 max-w-4xl">
                    <button
                      onClick={() => handleUpdateStatus('unregistered')}
                      className={`p-6 rounded-2xl border text-left transition-all ${
                        verificationStatus === 'unregistered'
                          ? 'border-brand bg-brand/10 text-white shadow-xl shadow-brand/10'
                          : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <Fingerprint className="w-8 h-8 text-brand mb-4" />
                      <h4 className="font-black text-sm text-white mb-2">1. Nouveau Candidat</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Simule un artisan local de Luiza qui s'inscrit pour la première fois. Il verra l'accord officiel et l'onboarding contractuel.
                      </p>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('pending')}
                      className={`p-6 rounded-2xl border text-left transition-all ${
                        verificationStatus === 'pending'
                          ? 'border-brand bg-brand/10 text-white shadow-xl shadow-brand/10'
                          : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <Scale className="w-8 h-8 text-brand mb-4" />
                      <h4 className="font-black text-sm text-white mb-2">2. Audit de Validation</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Le candidat a signé et téléversé son RCCM/CNI. Son dossier est soumis au greffe de Kananga pour modération de conformité par le Bureau.
                      </p>
                    </button>

                    <button
                      onClick={() => handleUpdateStatus('verified')}
                      className={`p-6 rounded-2xl border text-left transition-all ${
                        verificationStatus === 'verified'
                          ? 'border-brand bg-brand/10 text-white shadow-xl shadow-brand/10'
                          : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <CheckCircle2 className="w-8 h-8 text-brand mb-4" />
                      <h4 className="font-black text-sm text-white mb-2">3. Marchand Certifié</h4>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Session certifiée. Accès total au grand livre comptable de ventes, au gestionnaire de produits et aux liaisons de versements Mobile Money.
                      </p>
                    </button>
                  </div>
                </div>
              </div>

              {/* RBAC SIMULATION GRID */}
              <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b dark:border-zinc-850 pb-6 mb-6">
                  <div>
                    <h3 className="text-xl font-black dark:text-white flex items-center gap-2">
                      <Fingerprint className="w-6 h-6 text-brand" />
                      Simulateur de Session Administrative & RBAC
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Basculez entre différentes identités d'auditeurs pour tester dynamiquement les verrous d'écriture et les verifications matricielles.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                  <div className="lg:col-span-7 space-y-4">
                    <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider block mb-2">
                      Sélectionner un profil d'administrateur fictif :
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {adminAccounts.map((admin) => {
                        const isCurrentActive = admin.email === activeAdminEmail;
                        const roleMeta = ROLE_PERMISSIONS[admin.role] || ROLE_PERMISSIONS['Lecteur / Observateur'];
                        return (
                          <button
                            key={admin.id}
                            onClick={() => {
                              sessionStorage.setItem('eladma_active_admin_email', admin.email);
                              toast.success(`Profil de Session activé : ${admin.name}`, {
                                description: `Rôle : ${admin.role}. Toutes les autorisations ont été adaptées.`,
                                duration: 3000
                              });
                              sounds.success();
                              haptics.heavy();
                              setAdminAccounts([...adminAccounts]);
                            }}
                            className={`p-4 rounded-2xl border text-left flex flex-col justify-between h-36 transition-all ${
                              isCurrentActive 
                                ? 'bg-zinc-950 border-brand text-white shadow-lg shadow-brand/5 dark:bg-zinc-950' 
                                : 'bg-zinc-50 dark:bg-zinc-950/40 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700 text-zinc-650'
                            }`}
                          >
                            <div>
                              <div className="flex items-center justify-between gap-2">
                                <span className={`text-[9px] px-2 py-0.5 rounded-full font-black uppercase tracking-wider ${
                                  isCurrentActive ? 'bg-brand text-white' : 'bg-zinc-200 dark:bg-zinc-850 text-zinc-600 dark:text-zinc-400'
                                }`}>
                                  {roleMeta.label}
                                </span>
                                {isCurrentActive && (
                                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 relative" title="Session active">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                  </span>
                                )}
                              </div>
                              <p className={`font-black text-xs mt-3 ${isCurrentActive ? 'text-white' : 'text-zinc-800 dark:text-white'}`}>{admin.name}</p>
                              <p className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">{admin.email}</p>
                            </div>
                            <p className="text-[9px] text-zinc-500 italic mt-2 line-clamp-1">
                              {roleMeta.description}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="lg:col-span-5 bg-zinc-50 dark:bg-zinc-950/40 rounded-[2rem] border dark:border-zinc-800 p-6 flex flex-col justify-between gap-5">
                    <div>
                      <span className="text-[9px] text-brand uppercase font-black tracking-widest block mb-1">
                        Profil actif en session
                      </span>
                      <h4 className="text-base font-black dark:text-white text-zinc-900 leading-tight">
                        {currentAccount.name}
                      </h4>
                      <p className="text-xs text-zinc-500 font-semibold mt-0.5">{currentAccount.role}</p>

                      <div className="mt-5 space-y-3 pt-4 border-t dark:border-zinc-850">
                        <span className="text-[10px] text-zinc-400 dark:text-zinc-500 font-black uppercase tracking-wider block mb-1">
                          Autorisations de Sécurité
                        </span>

                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-zinc-500">Lecture & Diagnostics</span>
                          <span className="text-emerald-500 flex items-center gap-1 font-bold">
                            <Check className="w-3.5 h-3.5" /> Actif
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-zinc-500">Modération de dossiers</span>
                          {currentPermissions.canModeratePartners ? (
                            <span className="text-emerald-500 flex items-center gap-1 font-bold">
                              <Check className="w-3.5 h-3.5" /> Autorisé
                            </span>
                          ) : (
                            <span className="text-rose-500/80 flex items-center gap-1 font-bold">
                              <Lock className="w-3 h-3 text-rose-400" /> Restreint
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-zinc-500">Configuration plateforme</span>
                          {currentPermissions.canManageSiteConfig ? (
                            <span className="text-emerald-500 flex items-center gap-1 font-bold">
                              <Check className="w-3.5 h-3.5" /> Autorisé
                            </span>
                          ) : (
                            <span className="text-rose-500/80 flex items-center gap-1 font-bold">
                              <Lock className="w-3 h-3 text-rose-400" /> Restreint
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-zinc-500">Accréditation du personnel</span>
                          {currentPermissions.canManageStaff ? (
                            <span className="text-emerald-500 flex items-center gap-1 font-bold">
                              <Check className="w-3.5 h-3.5" /> Autorisé
                            </span>
                          ) : (
                            <span className="text-rose-500/80 flex items-center gap-1 font-bold">
                              <Lock className="w-3 h-3 text-rose-400" /> Restreint
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-brand/5 border border-brand/10 rounded-xl">
                      <p className="text-[10px] text-brand leading-relaxed font-semibold">
                        📌 <strong>Note réglementaire :</strong> Toutes vos actions dans les autres onglets sont conditionnées par cette identité. Connectez un profil de "Lecteur / Viewer" pour observer les verrous d'écriture partout !
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAP: Audit candidats */}
          {activeTab === 'partner_audit' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              {/* Queue sidebar */}
              <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-[2.5rem] p-6 shadow-sm">
                <div>
                  <h4 className="text-sm font-black dark:text-white text-zinc-800 uppercase tracking-widest border-l-4 border-brand pl-3">
                    Files de modération (RDC)
                  </h4>
                  <p className="text-[11px] text-zinc-500 mt-2">
                    Candidatures d'artisans indigènes et de coopératives de production à instruire :
                  </p>
                </div>

                <div className="mt-6 space-y-3">
                  {partnerApplicants.map((app) => (
                    <button
                      key={app.id}
                      onClick={() => {
                        setAuditedApplicantId(app.id);
                        haptics.medium();
                        sounds.select();
                      }}
                      className={`w-full p-4 rounded-2xl text-left border transition-all flex items-center justify-between cursor-pointer ${
                        auditedApplicantId === app.id
                          ? 'border-brand bg-brand/[0.04] dark:bg-brand/[0.02] shadow-sm scale-102'
                          : 'border-zinc-200/60 dark:border-zinc-805 hover:border-zinc-300 dark:hover:border-zinc-750 bg-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img 
                          src={app.selfie} 
                          alt="Selfie" 
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-xl object-cover border dark:border-zinc-800" 
                        />
                        <div>
                          <p className="font-extrabold text-sm dark:text-white leading-tight truncate max-w-[150px]">{app.company}</p>
                          <p className="text-[10px] text-zinc-400 mt-1">{app.city} ({app.province})</p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {app.status === 'pending' ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse block" />
                        ) : app.status === 'verified' ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" />
                        ) : (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 block" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Detail file inspector */}
              <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 shadow-sm space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-zinc-800 pb-4">
                  <div className="flex items-center gap-4">
                    <img 
                      src={selectedApplicant.selfie} 
                      alt="Selfie" 
                      referrerPolicy="no-referrer"
                      className="w-14 h-14 rounded-2xl object-cover border dark:border-zinc-700" 
                    />
                    <div>
                      <h3 className="text-xl font-black dark:text-white leading-tight">
                        {selectedApplicant.company}
                      </h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Siège social : {selectedApplicant.city}, {selectedApplicant.province} (RDC)
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-1.5 self-start sm:self-center">
                    {selectedApplicant.status === 'pending' ? (
                      <span className="px-3 py-1.5 bg-amber-500/10 text-amber-500 rounded-xl text-xs font-black uppercase tracking-wider animate-pulse">
                        En Attente d'Audit
                      </span>
                    ) : selectedApplicant.status === 'verified' ? (
                      <span className="px-3 py-1.5 bg-emerald-500/10 text-emerald-500 rounded-xl text-xs font-black uppercase tracking-wider">
                        Dossier Approuvé
                      </span>
                    ) : (
                      <span className="px-3 py-1.5 bg-rose-500/10 text-rose-500 rounded-xl text-xs font-black uppercase tracking-wider">
                        Fichiers Rejetés
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-zinc-50 dark:bg-zinc-950 p-5 rounded-2xl space-y-2 border dark:border-zinc-800">
                  <h5 className="text-[10px] uppercase tracking-widest text-brand font-black flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" />
                    Adresse Physique Complète Déclarée
                  </h5>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 font-extrabold pr-4 leading-relaxed">
                    {selectedApplicant.address}
                  </p>
                </div>

                <div className="space-y-4">
                  <h4 className="text-xs font-black dark:text-white text-zinc-800 uppercase tracking-widest">
                    Inspection des justificatifs légaux téléversés
                  </h4>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {selectedApplicant.documents.map((doc) => (
                      <div key={doc.id} className="p-4 bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-800 rounded-2xl flex flex-col justify-between h-40">
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-[9px] text-zinc-400 font-bold uppercase tracking-wider">{doc.title}</label>
                            <span className="text-[9px] font-mono text-zinc-500">{doc.size}</span>
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <FileText className="w-5 h-5 text-brand" />
                            <p className="text-[11px] font-bold dark:text-zinc-200 text-zinc-700 truncate">{doc.name}</p>
                          </div>
                        </div>

                        <button 
                          onClick={() => setInspectingDoc({ title: doc.title, content: doc.content, file: doc.name })}
                          className="w-full text-center py-2 border dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-zinc-400" />
                          Analyser pièce
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Audit Actions */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t dark:border-zinc-800">
                  <button
                    onClick={() => handleRejectApplicant(selectedApplicant.id)}
                    className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 hover:bg-rose-500/10 text-zinc-650 dark:text-zinc-300 hover:text-rose-500 transition-all rounded-xl font-bold text-xs flex items-center justify-center gap-2"
                  >
                    <X className="w-4 h-4" /> Rejeter la candidature
                  </button>

                  <button
                    onClick={() => handleApproveApplicant(selectedApplicant.id)}
                    className="flex-1 py-4 bg-brand text-white font-black text-xs hover:bg-brand-dark rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand/20 hover:scale-[1.01]"
                  >
                    <Check className="w-4 h-4" /> Valider les documents RDC
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAP: Paramètres site */}
          {activeTab === 'site_config' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b dark:border-zinc-800 pb-6 mb-6">
                  <div>
                    <h3 className="text-xl font-black dark:text-white flex items-center gap-2">
                      <Settings className="w-6 h-6 text-brand" />
                      Configuration Globale de la Vitrine Eladma
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Contrôlez le branding légal, l'annonce principale de la plateforme et les contacts officiels.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleSaveConfig} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-xs font-black uppercase text-zinc-400 tracking-wider mb-2">Nom souverain du site</label>
                    <input 
                      type="text" 
                      value={siteName} 
                      onChange={(e) => setSiteName(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-4.5 text-sm outline-none focus:ring-2 focus:ring-brand font-bold dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-zinc-400 tracking-wider mb-2">Courriel officiel</label>
                    <input 
                      type="email" 
                      value={siteContactEmail} 
                      onChange={(e) => setSiteContactEmail(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-4.5 text-sm outline-none focus:ring-2 focus:ring-brand font-bold dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-zinc-400 tracking-wider mb-2">Numéro d'appel (soutien)</label>
                    <input 
                      type="text" 
                      value={siteContactPhone} 
                      onChange={(e) => setSiteContactPhone(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-4.5 text-sm outline-none focus:ring-2 focus:ring-brand font-bold dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-black uppercase text-zinc-400 tracking-wider mb-2">Bandeau d'actualités supérieur</label>
                    <input 
                      type="text" 
                      value={siteAnnouncement} 
                      onChange={(e) => setSiteAnnouncement(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-4.5 text-sm outline-none focus:ring-2 focus:ring-brand font-bold dark:text-white"
                    />
                  </div>

                  <div className="md:col-span-2 pt-4">
                    <button 
                      type="submit"
                      className="px-8 py-4 bg-brand text-white font-black text-xs uppercase tracking-wider rounded-xl hover:scale-102 active:scale-98 transition-all cursor-pointer shadow-lg shadow-brand/10"
                    >
                      Enregistrer les options vitrine
                    </button>
                  </div>
                </form>
              </div>

              {/* Policies Configuration */}
              <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
                <div className="border-b dark:border-zinc-800 pb-6 mb-6">
                  <h3 className="text-xl font-black dark:text-white flex items-center gap-2">
                    <FileText className="w-6 h-6 text-brand" />
                    Personnalisation des Politiques Légales d'Escrow (Mobile Money)
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Configurez les termes juridiques et les politiques du tiers de confiance (séquestre fiduciaire) pour protéger acheteurs et vendeurs locaux.
                  </p>
                </div>

                <form onSubmit={handleSavePolicies} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-xs font-black uppercase text-zinc-400 tracking-wider mb-2">Politique de livraison (Kananga & Luiza)</label>
                      <textarea 
                        value={policyShipping} 
                        onChange={(e) => setPolicyShipping(e.target.value)}
                        placeholder="Ex : Livraison par motos ou coursiers certifiés..."
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-4.5 h-36 text-xs outline-none focus:ring-2 focus:ring-brand leading-relaxed dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-zinc-400 tracking-wider mb-2">Garantie & Remboursement Escrow</label>
                      <textarea 
                        value={policyRefund} 
                        onChange={(e) => setPolicyRefund(e.target.value)}
                        placeholder="Ex : Fonds séquestrés 48h jusqu'à confirmation d'authenticité..."
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-4.5 h-36 text-xs outline-none focus:ring-2 focus:ring-brand leading-relaxed dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-zinc-400 tracking-wider mb-2">Conditions Générales d'Artisanat inclusif</label>
                      <textarea 
                        value={policyTerms} 
                        onChange={(e) => setPolicyTerms(e.target.value)}
                        placeholder="Ex : Adhésion obligatoire à la coopérative..."
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-4.5 h-36 text-xs outline-none focus:ring-2 focus:ring-brand leading-relaxed dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase text-zinc-400 tracking-wider mb-2">Confidentialité & Chiffrement d'identité</label>
                      <textarea 
                        value={policyPrivacy} 
                        onChange={(e) => setPolicyPrivacy(e.target.value)}
                        placeholder="Ex : Protection biométrique locale..."
                        className="w-full bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-4.5 h-36 text-xs outline-none focus:ring-2 focus:ring-brand leading-relaxed dark:text-white"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="px-8 py-4 bg-brand text-white font-black text-xs uppercase tracking-wider rounded-xl hover:scale-102 active:scale-98 transition-all cursor-pointer shadow-lg shadow-brand/10"
                  >
                    Sauvegarder les Textes de Loi
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* TAP: Personnel admin */}
          {activeTab === 'admin_accounts' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-8"
            >
              <div className="lg:col-span-8 space-y-8">
                {/* Registre card */}
                <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b dark:border-zinc-800 pb-6 mb-6">
                    <div>
                      <h3 className="text-xl font-black dark:text-white">Registre du personnel d'Eladma</h3>
                      <p className="text-xs text-zinc-500 mt-1">
                        Employés accrédités par la Direction. Les rôles peuvent être modifiés directement ci-dessous par les personnes autorisées.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={handleExportStaff}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-zinc-105 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 text-[10px] font-black rounded-xl border dark:border-zinc-700 transition-all cursor-pointer uppercase tracking-wider shadow-sm"
                        title="Exporter la configuration du personnel au format JSON"
                      >
                        <Download className="w-3.5 h-3.5 text-zinc-500" />
                        <span>Exporter JSON</span>
                      </button>

                      <div className="relative">
                        <input 
                          type="file" 
                          id="import-staff-file" 
                          accept=".json" 
                          onChange={handleImportStaff} 
                          className="hidden" 
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!currentPermissions.canManageStaff) {
                              toast.error("🔒 Droits de Super-Admin requis", {
                                description: "Seul un Super-Administrateur Général peut restaurer ou migrer la configuration d'accréditation du personnel d'État."
                              });
                              return;
                            }
                            document.getElementById('import-staff-file')?.click();
                          }}
                          className={`flex items-center gap-1.5 px-3.5 py-2 bg-brand/10 hover:bg-brand/15 text-brand text-[10px] font-black rounded-xl border border-brand/20 transition-all cursor-pointer uppercase tracking-wider shadow-sm ${
                            !currentPermissions.canManageStaff ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                          title="Importer la configuration du personnel depuis un fichier JSON"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Importer JSON</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Search and Filters Registry Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6 p-4 bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-150 dark:border-zinc-800">
                    <div className="relative">
                      <Search className="w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Rechercher par nom ou email..."
                        value={staffSearchQuery}
                        onChange={(e) => setStaffSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand font-bold dark:text-white"
                      />
                    </div>
                    <div className="relative">
                      <Filter className="w-3.5 h-3.5 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select
                        value={staffRoleFilter}
                        onChange={(e) => setStaffRoleFilter(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl text-xs outline-none focus:ring-1 focus:ring-brand font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer"
                      >
                        <option value="all">Tous les rôles d'État</option>
                        <option value="Super-Administrateur Général (Directeur RDC)">Super-Admin</option>
                        <option value="Chef de la Conformité Juridique">Conformité Juridique</option>
                        <option value="Modératrice Provinciale (Kananga)">Modératrice Provinciale</option>
                        <option value="Auditeur de Documents par Vision IA">Vision IA</option>
                        <option value="Inspecteur de Conformité">Inspecteur</option>
                        <option value="Auditeur Financier MobileMoney">Audit Financier</option>
                        <option value="Lecteur / Observateur">Lecteur / Observateur</option>
                      </select>
                    </div>
                  </div>

                  {filteredStaff.length === 0 ? (
                    <div className="text-center py-10 bg-zinc-50 dark:bg-zinc-950/40 border border-dashed border-zinc-200 dark:border-zinc-805 rounded-[1.5rem] p-6">
                      <AlertCircle className="w-8 h-8 text-zinc-400 dark:text-zinc-500 mx-auto mb-2 animate-bounce" />
                      <p className="text-xs font-bold text-zinc-650 dark:text-zinc-400">Aucun agent accrédité ne correspond aux critères de recherche.</p>
                      <button
                        onClick={() => { setStaffSearchQuery(''); setStaffRoleFilter('all'); }}
                        className="text-[10px] text-brand font-black uppercase mt-3 hover:underline cursor-pointer tracking-wider"
                      >
                        Réinitialiser tous les filtres
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredStaff.map((account) => {
                        const isSelf = account.email === activeAdminEmail;
                        return (
                          <div 
                            key={account.id} 
                            className={`p-4 rounded-2xl border transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                              isSelf 
                                ? 'bg-brand/5 border-brand/30 dark:bg-zinc-950 dark:border-brand/35' 
                                : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-150 dark:border-zinc-800'
                            }`}
                          >
                            <div className="flex items-center gap-3 w-full md:w-auto">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm border shrink-0 ${
                                isSelf 
                                  ? 'bg-brand/15 text-brand border-brand/20' 
                                  : 'bg-zinc-250 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 dark:border-zinc-800'
                              }`}>
                                {account.name.split(' ').map(n => n[0]).join('')}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-extrabold text-sm dark:text-white leading-none truncate">{account.name}</p>
                                  {isSelf && (
                                    <span className="text-[8px] px-1.5 py-0.5 bg-brand text-white font-black uppercase rounded tracking-wider shrink-0">
                                      Vous
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-zinc-500 mt-1 truncate">{account.email} • Inscrit le {account.joined}</p>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto pt-3 md:pt-0 border-t md:border-0 border-zinc-200 dark:border-zinc-800">
                              {/* Role Dropdown Selector */}
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-550 uppercase tracking-wider">Rôle :</span>
                                <select
                                  value={account.role}
                                  disabled={!currentPermissions.canManageStaff}
                                  onChange={(e) => handleUpdateAdminRole(account.id, e.target.value)}
                                  className={`px-2.5 py-1.5 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-xl text-[10px] font-black uppercase tracking-wider outline-none text-zinc-700 dark:text-zinc-300 focus:ring-1 focus:ring-brand cursor-pointer ${
                                    !currentPermissions.canManageStaff ? 'opacity-85 cursor-not-allowed bg-zinc-100 dark:bg-zinc-950' : 'hover:border-zinc-300 dark:hover:border-zinc-700'
                                  }`}
                                >
                                  <option value="Super-Administrateur Général (Directeur RDC)">Super-Admin</option>
                                  <option value="Chef de la Conformité Juridique">Conformité Juridique</option>
                                  <option value="Modératrice Provinciale (Kananga)">Modératrice Provinciale</option>
                                  <option value="Auditeur de Documents par Vision IA">Vision IA</option>
                                  <option value="Inspecteur de Conformité">Inspecteur</option>
                                  <option value="Auditeur Financier MobileMoney">Audit Financier</option>
                                  <option value="Lecteur / Observateur">Lecteur / Viewer (Lecteur)</option>
                                </select>
                              </div>

                              {/* Accreditations Action */}
                              <button
                                onClick={() => handleDeleteAdmin(account.id)}
                                disabled={!currentPermissions.canManageStaff || account.id === 'admin-1'}
                                className={`p-2 rounded-lg transition-colors ${
                                  !currentPermissions.canManageStaff || account.id === 'admin-1'
                                    ? 'text-zinc-300 dark:text-zinc-800 cursor-not-allowed'
                                    : 'text-zinc-450 hover:text-red-500 hover:bg-red-500/10 cursor-pointer'
                                }`}
                                title={account.id === 'admin-1' ? "Le Super-Admin de référence ne peut pas être révoqué" : "Révoquer accès"}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Matrix card */}
                <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
                  <div className="border-b dark:border-zinc-800 pb-5 mb-5">
                    <h3 className="text-base font-black dark:text-white flex items-center gap-2">
                      <Scale className="w-5 h-5 text-brand" />
                      Matrice de Contrôle Légale des Droits d'Accès (RBAC)
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Cartographie stricte des autorisations juridiques conférées à chaque classe de personnel.
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="border-b border-zinc-150 dark:border-zinc-800 text-[10px] font-black uppercase text-zinc-400 tracking-wider">
                          <th className="pb-3 pr-4">Classe de Personnel</th>
                          <th className="pb-3 px-3 text-center">Rapports &amp; Audit</th>
                          <th className="pb-3 px-3 text-center">Modération Marchand</th>
                          <th className="pb-3 px-3 text-center">Configurations de l'État</th>
                          <th className="pb-3 pl-4 text-center">Gestion Équipe</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 dark:divide-zinc-850">
                        {[
                          { name: 'Super-Administrateur Général', sub: 'Directeur RDC', reports: 'Total (✓)', mod: 'Total (✓)', state: 'Total (✓)', team: 'Total (✓)' },
                          { name: 'Chef de la Conformité Juridique', sub: 'Cadre Inspecteur', reports: 'Total (✓)', mod: 'Total (✓)', state: 'Total (✓)', team: 'Bloqué (🔒)' },
                          { name: 'Modératrice Provinciale / IA', sub: 'Terrain', reports: 'Total (✓)', mod: 'Total (✓)', state: 'Bloqué (🔒)', team: 'Bloqué (🔒)' },
                          { name: 'Auditeur Financier', sub: 'Trésorerie', reports: 'Total (✓)', mod: 'Bloqué (🔒)', state: 'Bloqué (🔒)', team: 'Bloqué (🔒)' },
                          { name: 'Lecteur / Observateur', sub: 'Viewer Externe', reports: 'Lecture seule (✓)', mod: 'Bloqué (🔒)', state: 'Bloqué (🔒)', team: 'Bloqué (🔒)' },
                        ].map((row, idx) => (
                          <tr key={idx} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/40">
                            <td className="py-3.5 pr-4">
                              <p className="font-extrabold dark:text-white text-zinc-800">{row.name}</p>
                              <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{row.sub}</p>
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono text-[10px]">
                              <span className="px-1.5 py-0.5 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-md font-bold">{row.reports}</span>
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono text-[10px]">
                              <span className={`px-1.5 py-0.5 rounded-md font-bold ${
                                row.mod.includes('✓') 
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-455'
                              }`}>{row.mod}</span>
                            </td>
                            <td className="py-3.5 px-3 text-center font-mono text-[10px]">
                              <span className={`px-1.5 py-0.5 rounded-md font-bold ${
                                row.state.includes('✓') 
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-455'
                              }`}>{row.state}</span>
                            </td>
                            <td className="py-3.5 pl-4 text-center font-mono text-[10px]">
                              <span className={`px-1.5 py-0.5 rounded-md font-bold ${
                                row.team.includes('✓') 
                                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                                  : 'bg-rose-500/10 text-rose-600 dark:text-rose-455'
                              }`}>{row.team}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Form to add an admin */}
              <div className="lg:col-span-4 bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 shadow-sm h-fit relative overflow-hidden">
                {!currentPermissions.canManageStaff && (
                  <div className="absolute inset-0 bg-stone-100/90 dark:bg-zinc-950/95 backdrop-blur-[1px] z-20 flex flex-col items-center justify-center p-6 text-center">
                    <Lock className="w-10 h-10 text-brand mb-3 animate-pulse" />
                    <h4 className="text-sm font-black dark:text-white uppercase tracking-wider text-black">Formulaire Verrouillé</h4>
                    <p className="text-[11px] text-zinc-500 mt-1 max-w-[240px] leading-relaxed">
                      Seul le rôle de <strong>Super-Administrateur Général</strong> possède l'autorité d'accréditer du nouveau personnel d'État.
                    </p>
                  </div>
                )}

                <h4 className="text-sm font-black dark:text-white uppercase tracking-widest border-l-4 border-brand pl-3 mb-6">Accréditer un modérateur</h4>
                
                <form onSubmit={handleAddAdmin} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1.5">Nom &amp; Prénom</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Marie Ngalula"
                      value={newAdminName} 
                      onChange={(e) => setNewAdminName(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-3.5 text-xs outline-none focus:ring-2 focus:ring-brand font-bold dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1.5">Adresse de messagerie</label>
                    <input 
                      required
                      type="email" 
                      placeholder="marie@eladma.com"
                      value={newAdminEmail} 
                      onChange={(e) => setNewAdminEmail(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-3.5 text-xs outline-none focus:ring-2 focus:ring-brand font-bold dark:text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-zinc-400 uppercase tracking-wider mb-1.5">Rôle &amp; Juridiction</label>
                    <select 
                      value={newAdminRole} 
                      onChange={(e) => setNewAdminRole(e.target.value)}
                      className="w-full bg-zinc-50 dark:bg-zinc-950 border dark:border-zinc-800 rounded-xl p-3.5 text-xs outline-none focus:ring-2 focus:ring-brand font-bold dark:text-white"
                    >
                      <option value="Super-Administrateur Général (Directeur RDC)">Super-Administrateur Général (Directeur RDC)</option>
                      <option value="Chef de la Conformité Juridique">Chef de la Conformité Juridique</option>
                      <option value="Modératrice Provinciale (Kananga)">Modératrice Provinciale (Kananga)</option>
                      <option value="Auditeur de Documents par Vision IA">Auditeur de Documents par Vision IA</option>
                      <option value="Inspecteur de Conformité">Inspecteur de Conformité</option>
                      <option value="Auditeur Financier MobileMoney">Auditeur Financier MobileMoney</option>
                      <option value="Lecteur / Observateur">Lecteur / Observateur (Viewer)</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-brand text-white font-black text-xs uppercase tracking-wider rounded-xl hover:scale-102 active:scale-98 transition-all cursor-pointer shadow-lg shadow-brand/10 mt-2"
                  >
                    Ajouter au Personnel RDC
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {/* TAP: Sécurité & Journaux d'attaques / Anti-Cloning */}
          {activeTab === 'security_logs' && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 rounded-[2.5rem] p-6 md:p-8 shadow-sm">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b dark:border-zinc-800 pb-6 mb-6">
                  <div>
                    <h3 className="text-xl font-black dark:text-white flex items-center gap-2">
                      <ShieldAlert className="w-6 h-6 text-brand animate-pulse" />
                      Journal de menaces de l'AntiCloningSentinel
                    </h3>
                    <p className="text-xs text-zinc-500 mt-1">
                      Surveillance active contre l'espionnage, le vol de code source, le pillage de feuilles de style, et l'analyse de prompt de clonage par les IA.
                    </p>
                  </div>

                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={clearSecurityLogs}
                      className="px-4 py-2 bg-rose-500/15 text-rose-500 border border-rose-500/20 rounded-xl text-xs font-bold hover:bg-rose-500/25 transition-all flex items-center gap-1.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Réinitialiser les logs
                    </button>
                  </div>
                </div>

                {securityThreats.length === 0 ? (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ShieldCheck className="w-8 h-8" />
                    </div>
                    <h4 className="font-extrabold text-sm dark:text-white text-zinc-700">Aucune menace détectée</h4>
                    <p className="text-xs text-zinc-400 mt-1 max-w-sm mx-auto">
                      L'AntiCloningSentinel protège activement cette instance. Les attaques au clavier (F12, Inspecter), le clic-droit et le vol de texte sont bloqués.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {securityThreats.map((threat, idx) => (
                      <div key={idx} className="p-4 bg-zinc-950 text-zinc-300 font-mono text-xs rounded-2xl border border-zinc-800 flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] uppercase font-black px-2 py-0.5 bg-red-500/10 text-red-500 rounded border border-red-500/20">
                              {threat.type}
                            </span>
                            <span className="text-[10px] text-zinc-500">{threat.timestamp}</span>
                          </div>
                          <p className="text-zinc-400 leading-relaxed text-[11px] font-semibold">{threat.message}</p>
                          <div className="text-[10px] text-zinc-500 flex items-center gap-2">
                            <span>Origine: <strong className="text-zinc-400">{threat.source || 'Inconnu'}</strong></span>
                            <span>Sévérité: <strong className="text-red-400 font-black">CRITIQUE</strong></span>
                          </div>
                        </div>

                        <span className="text-red-500 animate-pulse text-[10px] uppercase font-black tracking-wider flex items-center gap-1 shrink-0">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Bloqué
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>

      {/* Model Analysis & Inspection Overlay Modal */}
      {inspectingDoc && (
        <div className="fixed inset-0 z-[110] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white dark:bg-zinc-900 border dark:border-zinc-800 w-full max-w-2xl rounded-[2.5rem] shadow-3xl overflow-hidden"
          >
            <div className="p-6 md:p-8 border-b dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950">
              <div className="flex items-center gap-3">
                <FileText className="w-6 h-6 text-brand" />
                <div>
                  <h4 className="font-extrabold text-sm dark:text-white">{inspectingDoc.title}</h4>
                  <p className="text-[10px] text-zinc-400">{inspectingDoc.file}</p>
                </div>
              </div>
              <button 
                onClick={() => setInspectingDoc(null)}
                className="p-2 hover:bg-zinc-200 dark:hover:bg-zinc-800 rounded-full transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 dark:text-white" />
              </button>
            </div>

            <div className="p-6 md:p-8 font-mono text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto bg-zinc-50/50 dark:bg-zinc-950/20">
              {inspectingDoc.content}
            </div>

            <div className="p-6 border-t dark:border-zinc-800 flex justify-end">
              <button 
                onClick={() => setInspectingDoc(null)}
                className="px-6 py-3 bg-zinc-900 dark:bg-zinc-950 text-white rounded-xl text-xs font-bold transition-all hover:scale-102"
              >
                Fermer l'analyse
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
};

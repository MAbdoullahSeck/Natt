export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.18"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      abonnements: {
        Row: {
          created_at: string
          expire_at: string | null
          id: string
          palier: Database["public"]["Enums"]["palier"]
          periodicite: string
          profil_id: string
          statut: string
        }
        Insert: {
          created_at?: string
          expire_at?: string | null
          id?: string
          palier: Database["public"]["Enums"]["palier"]
          periodicite: string
          profil_id: string
          statut: string
        }
        Update: {
          created_at?: string
          expire_at?: string | null
          id?: string
          palier?: Database["public"]["Enums"]["palier"]
          periodicite?: string
          profil_id?: string
          statut?: string
        }
        Relationships: [
          {
            foreignKeyName: "abonnements_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abonnements_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profils_publics"
            referencedColumns: ["id"]
          },
        ]
      }
      cotisations: {
        Row: {
          capture_path: string | null
          declare_at: string | null
          id: string
          membre_id: string
          moyen: string | null
          paye_at: string | null
          statut: Database["public"]["Enums"]["statut_cotisation"]
          tour_id: string
        }
        Insert: {
          capture_path?: string | null
          declare_at?: string | null
          id?: string
          membre_id: string
          moyen?: string | null
          paye_at?: string | null
          statut?: Database["public"]["Enums"]["statut_cotisation"]
          tour_id: string
        }
        Update: {
          capture_path?: string | null
          declare_at?: string | null
          id?: string
          membre_id?: string
          moyen?: string | null
          paye_at?: string | null
          statut?: Database["public"]["Enums"]["statut_cotisation"]
          tour_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cotisations_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cotisations_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "tours"
            referencedColumns: ["id"]
          },
        ]
      }
      evenements: {
        Row: {
          auteur_id: string | null
          created_at: string
          donnees: Json
          id: string
          membre_id: string | null
          tontine_id: string | null
          type: string
        }
        Insert: {
          auteur_id?: string | null
          created_at?: string
          donnees?: Json
          id?: string
          membre_id?: string | null
          tontine_id?: string | null
          type: string
        }
        Update: {
          auteur_id?: string | null
          created_at?: string
          donnees?: Json
          id?: string
          membre_id?: string | null
          tontine_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "evenements_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_auteur_id_fkey"
            columns: ["auteur_id"]
            isOneToOne: false
            referencedRelation: "profils_publics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_membre_id_fkey"
            columns: ["membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "evenements_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
        ]
      }
      evenements_calendrier: {
        Row: {
          created_at: string
          date_debut: string
          date_fin: string | null
          id: string
          nom: string
        }
        Insert: {
          created_at?: string
          date_debut: string
          date_fin?: string | null
          id?: string
          nom: string
        }
        Update: {
          created_at?: string
          date_debut?: string
          date_fin?: string | null
          id?: string
          nom?: string
        }
        Relationships: []
      }
      membres: {
        Row: {
          created_at: string
          id: string
          profil_id: string
          rang: number | null
          reglement_accepte_at: string | null
          reglement_version_acceptee: number | null
          tontine_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          profil_id: string
          rang?: number | null
          reglement_accepte_at?: string | null
          reglement_version_acceptee?: number | null
          tontine_id: string
        }
        Update: {
          created_at?: string
          id?: string
          profil_id?: string
          rang?: number | null
          reglement_accepte_at?: string | null
          reglement_version_acceptee?: number | null
          tontine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "membres_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membres_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profils_publics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "membres_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          corps: string
          created_at: string
          donnees: Json
          id: string
          lu_at: string | null
          profil_id: string
          push_envoye_at: string | null
          titre: string
          tontine_id: string | null
          type: string
        }
        Insert: {
          corps: string
          created_at?: string
          donnees?: Json
          id?: string
          lu_at?: string | null
          profil_id: string
          push_envoye_at?: string | null
          titre: string
          tontine_id?: string | null
          type: string
        }
        Update: {
          corps?: string
          created_at?: string
          donnees?: Json
          id?: string
          lu_at?: string | null
          profil_id?: string
          push_envoye_at?: string | null
          titre?: string
          tontine_id?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profils_publics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
        ]
      }
      paiements_abonnement: {
        Row: {
          abonnement_id: string | null
          annule_at: string | null
          created_at: string
          donnees_ipn: Json | null
          id: string
          montant: number
          moyen: string | null
          palier: Database["public"]["Enums"]["palier"]
          paye_at: string | null
          periodicite: string
          profil_id: string
          ref_command: string
          statut: string
          token_paytech: string | null
        }
        Insert: {
          abonnement_id?: string | null
          annule_at?: string | null
          created_at?: string
          donnees_ipn?: Json | null
          id?: string
          montant: number
          moyen?: string | null
          palier: Database["public"]["Enums"]["palier"]
          paye_at?: string | null
          periodicite: string
          profil_id: string
          ref_command: string
          statut?: string
          token_paytech?: string | null
        }
        Update: {
          abonnement_id?: string | null
          annule_at?: string | null
          created_at?: string
          donnees_ipn?: Json | null
          id?: string
          montant?: number
          moyen?: string | null
          palier?: Database["public"]["Enums"]["palier"]
          paye_at?: string | null
          periodicite?: string
          profil_id?: string
          ref_command?: string
          statut?: string
          token_paytech?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "paiements_abonnement_abonnement_id_fkey"
            columns: ["abonnement_id"]
            isOneToOne: false
            referencedRelation: "abonnements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_abonnement_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_abonnement_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profils_publics"
            referencedColumns: ["id"]
          },
        ]
      }
      profils: {
        Row: {
          consentement_at: string
          consentement_retire_at: string | null
          consentement_version: string
          created_at: string
          expo_push_token: string | null
          fondatrice: boolean
          id: string
          langue: string
          prenom: string
          telephone: string
        }
        Insert: {
          consentement_at: string
          consentement_retire_at?: string | null
          consentement_version: string
          created_at?: string
          expo_push_token?: string | null
          fondatrice?: boolean
          id: string
          langue?: string
          prenom: string
          telephone: string
        }
        Update: {
          consentement_at?: string
          consentement_retire_at?: string | null
          consentement_version?: string
          created_at?: string
          expo_push_token?: string | null
          fondatrice?: boolean
          id?: string
          langue?: string
          prenom?: string
          telephone?: string
        }
        Relationships: []
      }
      reglements: {
        Row: {
          created_at: string
          id: string
          lignes: string[]
          tontine_id: string
          version: number
        }
        Insert: {
          created_at?: string
          id?: string
          lignes: string[]
          tontine_id: string
          version: number
        }
        Update: {
          created_at?: string
          id?: string
          lignes?: string[]
          tontine_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "reglements_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
        ]
      }
      tontines: {
        Row: {
          bien_prevu: string | null
          code: string
          created_at: string
          cycle_precedent_id: string | null
          date_debut: string
          frequence: Database["public"]["Enums"]["frequence"]
          gerante_id: string
          id: string
          montant: number
          nb_membres: number
          nom: string
          penalite_retard: number
          reglement_libres: string[]
          relance_j_moins_3: boolean
          relance_j_plus_1: boolean
          relance_jour_j: boolean
          statut: Database["public"]["Enums"]["statut_tontine"]
          type: Database["public"]["Enums"]["type_tontine"]
        }
        Insert: {
          bien_prevu?: string | null
          code: string
          created_at?: string
          cycle_precedent_id?: string | null
          date_debut: string
          frequence: Database["public"]["Enums"]["frequence"]
          gerante_id: string
          id?: string
          montant: number
          nb_membres: number
          nom: string
          penalite_retard?: number
          reglement_libres?: string[]
          relance_j_moins_3?: boolean
          relance_j_plus_1?: boolean
          relance_jour_j?: boolean
          statut?: Database["public"]["Enums"]["statut_tontine"]
          type?: Database["public"]["Enums"]["type_tontine"]
        }
        Update: {
          bien_prevu?: string | null
          code?: string
          created_at?: string
          cycle_precedent_id?: string | null
          date_debut?: string
          frequence?: Database["public"]["Enums"]["frequence"]
          gerante_id?: string
          id?: string
          montant?: number
          nb_membres?: number
          nom?: string
          penalite_retard?: number
          reglement_libres?: string[]
          relance_j_moins_3?: boolean
          relance_j_plus_1?: boolean
          relance_jour_j?: boolean
          statut?: Database["public"]["Enums"]["statut_tontine"]
          type?: Database["public"]["Enums"]["type_tontine"]
        }
        Relationships: [
          {
            foreignKeyName: "tontines_cycle_precedent_id_fkey"
            columns: ["cycle_precedent_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontines_gerante_id_fkey"
            columns: ["gerante_id"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontines_gerante_id_fkey"
            columns: ["gerante_id"]
            isOneToOne: false
            referencedRelation: "profils_publics"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          beneficiaire_membre_id: string | null
          echeance: string
          id: string
          numero: number
          tontine_id: string
          verse_at: string | null
        }
        Insert: {
          beneficiaire_membre_id?: string | null
          echeance: string
          id?: string
          numero: number
          tontine_id: string
          verse_at?: string | null
        }
        Update: {
          beneficiaire_membre_id?: string | null
          echeance?: string
          id?: string
          numero?: number
          tontine_id?: string
          verse_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tours_beneficiaire_membre_id_fkey"
            columns: ["beneficiaire_membre_id"]
            isOneToOne: false
            referencedRelation: "membres"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
        ]
      }
      vues_tirage: {
        Row: {
          evenement_id: string
          profil_id: string
          vu_at: string
        }
        Insert: {
          evenement_id: string
          profil_id: string
          vu_at?: string
        }
        Update: {
          evenement_id?: string
          profil_id?: string
          vu_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "vues_tirage_evenement_id_fkey"
            columns: ["evenement_id"]
            isOneToOne: false
            referencedRelation: "evenements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vues_tirage_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profils"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vues_tirage_profil_id_fkey"
            columns: ["profil_id"]
            isOneToOne: false
            referencedRelation: "profils_publics"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      profils_publics: {
        Row: {
          id: string | null
          prenom: string | null
          telephone: string | null
        }
        Insert: {
          id?: string | null
          prenom?: string | null
          telephone?: string | null
        }
        Update: {
          id?: string | null
          prenom?: string | null
          telephone?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      accepter_reglement: {
        Args: { p_tontine_id: string; p_version: number }
        Returns: undefined
      }
      activer_abonnement: {
        Args: { p_abonnement_id: string }
        Returns: {
          created_at: string
          expire_at: string | null
          id: string
          palier: Database["public"]["Enums"]["palier"]
          periodicite: string
          profil_id: string
          statut: string
        }
        SetofOptions: {
          from: "*"
          to: "abonnements"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      ajouter_membre: {
        Args: { p_profil_id: string; p_tontine_id: string }
        Returns: string
      }
      annuler_penalite: { Args: { p_evenement_id: string }; Returns: undefined }
      apercu_tontine: {
        Args: { p_code: string }
        Returns: {
          bien_prevu: string
          date_debut: string
          frequence: Database["public"]["Enums"]["frequence"]
          gerante_prenom: string
          id: string
          montant: number
          nb_inscrits: number
          nb_membres: number
          nom: string
          ordre_tirage: boolean
          reglement_lignes: string[]
          reglement_version: number
          type: Database["public"]["Enums"]["type_tontine"]
        }[]
      }
      appeler_fonction: {
        Args: { p_corps?: Json; p_nom: string }
        Returns: number
      }
      appliquer_ordre: {
        Args: { p_ordre: string[]; p_tontine_id: string }
        Returns: undefined
      }
      appliquer_tirage: {
        Args: {
          p_algorithme: string
          p_auteur_id: string
          p_graine: string
          p_ordre: string[]
          p_tontine_id: string
        }
        Returns: string
      }
      aujourdhui_dakar: { Args: never; Returns: string }
      capture_de_ma_tontine: { Args: { p_nom: string }; Returns: boolean }
      capture_du_membre: { Args: { p_nom: string }; Returns: boolean }
      confirmer_paiement: {
        Args: { p_cotisation_id: string }
        Returns: undefined
      }
      cotisations_dues: {
        Args: { p_tontine_id: string }
        Returns: {
          cotisation_id: string
          echeance: string
          membre_id: string
          profil_id: string
          statut: Database["public"]["Enums"]["statut_cotisation"]
          tour_id: string
        }[]
      }
      creer_paiement_abonnement: {
        Args: {
          p_expire: number
          p_palier: string
          p_periodicite: string
          p_profil_id: string
          p_signature: string
        }
        Returns: {
          abonnement_id: string | null
          annule_at: string | null
          created_at: string
          donnees_ipn: Json | null
          id: string
          montant: number
          moyen: string | null
          palier: Database["public"]["Enums"]["palier"]
          paye_at: string | null
          periodicite: string
          profil_id: string
          ref_command: string
          statut: string
          token_paytech: string | null
        }
        SetofOptions: {
          from: "*"
          to: "paiements_abonnement"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      creer_profil: {
        Args: { p_consentement_version: string; p_prenom: string }
        Returns: {
          consentement_at: string
          consentement_retire_at: string | null
          consentement_version: string
          created_at: string
          expo_push_token: string | null
          fondatrice: boolean
          id: string
          langue: string
          prenom: string
          telephone: string
        }
        SetofOptions: {
          from: "*"
          to: "profils"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      creer_tontine: {
        Args: {
          p_bien_prevu: string
          p_date_debut: string
          p_frequence: Database["public"]["Enums"]["frequence"]
          p_montant: number
          p_nb_membres: number
          p_nom: string
          p_type: Database["public"]["Enums"]["type_tontine"]
        }
        Returns: {
          bien_prevu: string | null
          code: string
          created_at: string
          cycle_precedent_id: string | null
          date_debut: string
          frequence: Database["public"]["Enums"]["frequence"]
          gerante_id: string
          id: string
          montant: number
          nb_membres: number
          nom: string
          penalite_retard: number
          reglement_libres: string[]
          relance_j_moins_3: boolean
          relance_j_plus_1: boolean
          relance_jour_j: boolean
          statut: Database["public"]["Enums"]["statut_tontine"]
          type: Database["public"]["Enums"]["type_tontine"]
        }
        SetofOptions: {
          from: "*"
          to: "tontines"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      declarer_paiement: {
        Args: {
          p_capture_path?: string
          p_cotisation_id: string
          p_moyen: string
        }
        Returns: undefined
      }
      demander_lien_palier_superieur: { Args: never; Returns: boolean }
      demarrer_tontines: { Args: never; Returns: number }
      echanger_tours: {
        Args: { p_membre_a: string; p_membre_b: string }
        Returns: undefined
      }
      echeance_tour: {
        Args: {
          p_debut: string
          p_frequence: Database["public"]["Enums"]["frequence"]
          p_numero: number
        }
        Returns: string
      }
      enregistrer_token_paytech: {
        Args: { p_paiement_id: string; p_token: string }
        Returns: undefined
      }
      envoyer_lien_paiement: {
        Args: {
          p_palier: Database["public"]["Enums"]["palier"]
          p_periodicite: string
          p_profil_id: string
          p_raison: string
        }
        Returns: string
      }
      envoyer_liens_expiration: { Args: { p_jour?: string }; Returns: number }
      est_gerante: { Args: { p_tontine_id: string }; Returns: boolean }
      est_membre: { Args: { p_tontine_id: string }; Returns: boolean }
      exiger_gerante: { Args: { p_tontine_id: string }; Returns: undefined }
      expirer_abonnements: { Args: never; Returns: number }
      format_montant: { Args: { p_montant: number }; Returns: string }
      generer_code: { Args: never; Returns: string }
      generer_lignes_reglement: {
        Args: { p_tontine_id: string }
        Returns: string[]
      }
      joindre_capture: {
        Args: { p_capture_path: string; p_cotisation_id: string }
        Returns: undefined
      }
      jour_dakar: { Args: { p: string }; Returns: string }
      lien_paiement: {
        Args: {
          p_palier: Database["public"]["Enums"]["palier"]
          p_periodicite: string
          p_profil_id: string
          p_validite?: string
        }
        Returns: string
      }
      limite_tontines: { Args: { p_profil_id: string }; Returns: number }
      marquer_pousses: { Args: { p_ids: string[] }; Returns: undefined }
      marquer_tirage_vu: { Args: { p_tontine_id: string }; Returns: undefined }
      marquer_verse: {
        Args: { p_tour_id: string }
        Returns: Database["public"]["Enums"]["statut_tontine"]
      }
      mes_tontines: {
        Args: never
        Returns: {
          bien_prevu: string
          date_debut: string
          est_gerante: boolean
          frequence: Database["public"]["Enums"]["frequence"]
          gerante_prenom: string
          id: string
          ma_cotisation_statut: Database["public"]["Enums"]["statut_cotisation"]
          ma_declare_at: string
          ma_paye_at: string
          montant: number
          nb_inscrits: number
          nb_membres: number
          nom: string
          statut: Database["public"]["Enums"]["statut_tontine"]
          tour_echeance: string
          tour_numero: number
          type: Database["public"]["Enums"]["type_tontine"]
        }[]
      }
      modifier_reglages: {
        Args: {
          p_j_moins_3: boolean
          p_j_plus_1: boolean
          p_jour_j: boolean
          p_penalite: number
          p_tontine_id: string
        }
        Returns: undefined
      }
      modifier_reglement: {
        Args: { p_lignes_libres: string[]; p_tontine_id: string }
        Returns: number
      }
      notifications_a_pousser: {
        Args: { p_limite?: number }
        Returns: {
          corps: string
          created_at: string
          donnees: Json
          id: string
          jeton: string
          titre: string
          tontine_id: string
          type: string
        }[]
      }
      notifier: {
        Args: {
          p_corps: string
          p_profil_id: string
          p_titre: string
          p_tontine_id: string
          p_type: string
        }
        Returns: string
      }
      nouvelle_expiration: {
        Args: {
          p_fin_actuelle: string
          p_maintenant?: string
          p_periodicite: string
        }
        Returns: string
      }
      nouvelle_version_reglement: {
        Args: { p_tontine_id: string }
        Returns: number
      }
      partage_une_tontine: { Args: { p_profil_id: string }; Returns: boolean }
      preparer_relances: { Args: { p_jour?: string }; Returns: Json }
      preparer_relances_et_abonnements: {
        Args: { p_jour?: string }
        Returns: Json
      }
      prix_abonnement: {
        Args: {
          p_palier: Database["public"]["Enums"]["palier"]
          p_periodicite: string
        }
        Returns: number
      }
      rejoindre_tontine: {
        Args: { p_code: string; p_version_reglement: number }
        Returns: string
      }
      relancer: {
        Args: { p_membre_id?: string; p_tontine_id: string }
        Returns: number
      }
      relancer_cycle: {
        Args: { p_date_debut: string; p_tontine_id: string }
        Returns: {
          bien_prevu: string | null
          code: string
          created_at: string
          cycle_precedent_id: string | null
          date_debut: string
          frequence: Database["public"]["Enums"]["frequence"]
          gerante_id: string
          id: string
          montant: number
          nb_membres: number
          nom: string
          penalite_retard: number
          reglement_libres: string[]
          relance_j_moins_3: boolean
          relance_j_plus_1: boolean
          relance_jour_j: boolean
          statut: Database["public"]["Enums"]["statut_tontine"]
          type: Database["public"]["Enums"]["type_tontine"]
        }
        SetofOptions: {
          from: "*"
          to: "tontines"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      retirer_consentement: { Args: never; Returns: undefined }
      signature_lien_paiement: {
        Args: {
          p_expire: number
          p_palier: string
          p_periodicite: string
          p_profil_id: string
        }
        Returns: string
      }
      suggestions_calendrier: {
        Args: {
          p_date_debut: string
          p_frequence: Database["public"]["Enums"]["frequence"]
          p_nb_membres: number
        }
        Returns: {
          created_at: string
          date_debut: string
          date_fin: string | null
          id: string
          nom: string
        }[]
        SetofOptions: {
          from: "*"
          to: "evenements_calendrier"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      tontine_par_code: {
        Args: { p_code: string }
        Returns: {
          bien_prevu: string | null
          code: string
          created_at: string
          cycle_precedent_id: string | null
          date_debut: string
          frequence: Database["public"]["Enums"]["frequence"]
          gerante_id: string
          id: string
          montant: number
          nb_membres: number
          nom: string
          penalite_retard: number
          reglement_libres: string[]
          relance_j_moins_3: boolean
          relance_j_plus_1: boolean
          relance_jour_j: boolean
          statut: Database["public"]["Enums"]["statut_tontine"]
          type: Database["public"]["Enums"]["type_tontine"]
        }
        SetofOptions: {
          from: "*"
          to: "tontines"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      traiter_ipn_paytech: {
        Args: {
          p_donnees: Json
          p_evenement: string
          p_moyen: string
          p_ref_command: string
        }
        Returns: string
      }
      url_projet: { Args: never; Returns: string }
    }
    Enums: {
      frequence: "jour" | "semaine" | "mois"
      palier: "starter" | "pro" | "illimite"
      statut_cotisation: "a_payer" | "declare" | "paye"
      statut_tontine: "en_preparation" | "en_cours" | "terminee"
      type_tontine: "classique" | "achat_groupe"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      frequence: ["jour", "semaine", "mois"],
      palier: ["starter", "pro", "illimite"],
      statut_cotisation: ["a_payer", "declare", "paye"],
      statut_tontine: ["en_preparation", "en_cours", "terminee"],
      type_tontine: ["classique", "achat_groupe"],
    },
  },
} as const

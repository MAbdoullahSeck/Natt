-- Tontine des sœurs : tous les paiements confirmés, tous les tours versés sauf le dernier.
update public.cotisations c set statut = 'paye', declare_at = coalesce(declare_at, tr.echeance - 1), paye_at = coalesce(paye_at, tr.echeance)
from public.tours tr where tr.id = c.tour_id and tr.tontine_id = 'b0000000-0000-4000-8000-000000000001';
update public.tours set verse_at = echeance + interval '10 hours'
where tontine_id = 'b0000000-0000-4000-8000-000000000001' and numero < 6;

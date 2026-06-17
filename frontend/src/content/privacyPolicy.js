export const PRIVACY_POLICY = {
  title: "Politique de confidentialité",
  lastUpdated: "1 juin 2026",
  intro:
    "La présente politique décrit comment Buzzr collecte, utilise et protège vos données personnelles, conformément au Règlement général sur la protection des données (RGPD) et à la loi Informatique et Libertés.",
  sections: [
    {
      title: "1. Responsable du traitement",
      paragraphs: [
        "Le responsable du traitement des données est l'équipe Buzzr (projet Coda School).",
        "Pour toute question relative à vos données personnelles, vous pouvez nous contacter à : contact@buzzr.app (adresse à adapter avant mise en production).",
      ],
    },
    {
      title: "2. Données collectées",
      paragraphs: [
        "Lors de la création d'un compte : nom d'utilisateur, adresse e-mail, mot de passe (stocké sous forme chiffrée).",
        "Lors de l'utilisation du service : quiz créés, questions et réponses, sessions de jeu, scores et pseudonymes affichés en partie.",
        "Données techniques : jeton d'authentification stocké localement dans votre navigateur (localStorage) pour maintenir votre session.",
        "Données de modération (accès administrateur uniquement) : consultation tracée des comptes utilisateurs dans un journal d'audit.",
      ],
    },
    {
      title: "3. Finalités du traitement",
      paragraphs: [
        "Création et gestion de votre compte utilisateur.",
        "Vérification de votre adresse e-mail et réinitialisation de mot de passe.",
        "Fonctionnement du service de quiz multijoueur (création, participation, classements).",
        "Modération des contenus et des comptes en cas d'abus (accès réservé aux administrateurs).",
        "Sécurité du service et prévention des fraudes.",
      ],
    },
    {
      title: "4. Bases légales",
      paragraphs: [
        "Exécution du contrat (art. 6.1.b RGPD) : fourniture du service Buzzr après inscription.",
        "Consentement (art. 6.1.a RGPD) : acceptation de la présente politique lors de l'inscription.",
        "Intérêt légitime (art. 6.1.f RGPD) : sécurité du service, modération et traçabilité des actions administratives.",
      ],
    },
    {
      title: "5. Destinataires des données",
      paragraphs: [
        "Vos données sont hébergées sur nos serveurs et notre base de données MySQL.",
        "Les e-mails transactionnels (vérification de compte, réinitialisation de mot de passe) sont envoyés via un prestataire SMTP (ex. Mailtrap en environnement de développement).",
        "Aucune donnée n'est vendue à des tiers. Les administrateurs accèdent aux données strictement nécessaires à la modération.",
      ],
    },
    {
      title: "6. Durée de conservation",
      paragraphs: [
        "Compte actif : données conservées tant que le compte existe.",
        "Compte inactif : suppression ou anonymisation après 3 ans d'inactivité (durée indicative, à affiner avant production).",
        "Journaux d'audit administrateur : conservés 12 mois maximum.",
        "Sessions de jeu terminées : données de score conservées le temps nécessaire au fonctionnement du service.",
      ],
    },
    {
      title: "7. Vos droits",
      paragraphs: [
        "Conformément au RGPD, vous disposez des droits suivants : accès, rectification, effacement, limitation du traitement, opposition et portabilité de vos données.",
        "Pour exercer vos droits, contactez-nous à l'adresse indiquée en section 1. Nous répondrons dans un délai d'un mois.",
        "Vous pouvez également introduire une réclamation auprès de la CNIL (www.cnil.fr).",
        "La suppression de votre compte peut être demandée ; les données seront anonymisées conformément à notre procédure d'effacement.",
      ],
    },
    {
      title: "8. Sécurité",
      paragraphs: [
        "Les mots de passe sont hachés (bcrypt). Les communications avec l'API sont authentifiées par jeton JWT.",
        "L'accès à l'espace d'administration est restreint aux comptes administrateurs. Les adresses e-mail y sont masquées par défaut.",
        "Malgré ces mesures, aucun système n'est totalement invulnérable ; nous nous engageons à appliquer les bonnes pratiques de sécurité.",
      ],
    },
    {
      title: "9. Cookies et stockage local",
      paragraphs: [
        "Buzzr n'utilise pas de cookies publicitaires. Un jeton d'authentification est stocké dans le localStorage de votre navigateur pour vous maintenir connecté.",
        "Vous pouvez le supprimer en vous déconnectant ou en vidant les données du site dans les paramètres de votre navigateur.",
      ],
    },
    {
      title: "10. Modifications",
      paragraphs: [
        "Cette politique peut être mise à jour. La date de dernière mise à jour figure en haut de cette page.",
        "En cas de modification substantielle, les utilisateurs seront informés lors de leur prochaine connexion.",
      ],
    },
  ],
};

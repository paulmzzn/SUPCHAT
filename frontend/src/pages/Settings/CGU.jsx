import React from "react";
import "./CGU.css";

const CGU = () => (
  <div className="cgu-container">
    <h1>Conditions Générales d'Utilisation (CGU)</h1>
    <div className="last-update">Dernière mise à jour : Mai 2025</div>
    
    <p className="cgu-intro">
      Bienvenue sur SUPCHAT. L'utilisation de notre service implique l'acceptation pleine et entière des présentes Conditions Générales d'Utilisation.
    </p>
    
    <h2>1. Objet</h2>
    <p>
      SUPCHAT permet aux utilisateurs de communiquer, collaborer et partager des informations dans un cadre professionnel ou académique. Toute utilisation doit respecter la législation en vigueur et les règles de bonne conduite. La plateforme propose des fonctionnalités de messagerie instantanée, de partage de fichiers et de création d'espaces de travail collaboratifs.
    </p>
    
    <h2>2. Données personnelles et RGPD</h2>
    <p>
      Conformément au Règlement Général sur la Protection des Données (RGPD), nous nous engageons à :
    </p>
    <ul>
      <li>Collecter uniquement les données nécessaires au fonctionnement du service</li>
      <li>Ne pas revendre vos informations personnelles à des tiers</li>
      <li>Vous permettre d'accéder à vos données, de les modifier ou de les supprimer</li>
      <li>Vous garantir la possibilité d'exporter l'intégralité de vos données via l'onglet sécurité</li>
      <li>Sécuriser vos données selon les standards de l'industrie</li>
    </ul>
    <p>
      Pour exercer vos droits ou pour toute question relative à la protection de vos données, vous pouvez contacter notre délégué à la protection des données à l'adresse : REDACTED
    </p>
    
    <h2>3. Sécurité et confidentialité</h2>
    <p>
      SUPCHAT met en œuvre des mesures techniques et organisationnelles pour protéger vos données, notamment :
    </p>
    <ul>
      <li>Le chiffrement des communications</li>
      <li>L'authentification à deux facteurs (disponible dans les paramètres de sécurité)</li>
    </ul>
    <p>
      En tant qu'utilisateur, vous êtes responsable de la confidentialité de votre mot de passe et de vos informations de connexion. Nous vous recommandons de :
    </p>
    <ul>
      <li>Utiliser un mot de passe unique et complexe</li>
      <li>Ne jamais partager vos identifiants</li>
      <li>Vous déconnecter après chaque session sur un appareil partagé</li>
    </ul>
    
    <h2>4. Comportement des utilisateurs</h2>
    <p>
      Lors de l'utilisation de SUPCHAT, il est strictement interdit de :
    </p>
    <ul>
      <li>Publier des contenus illicites, offensants, diffamatoires ou discriminatoires</li>
      <li>Harceler d'autres utilisateurs ou adopter un comportement malveillant</li>
      <li>Tenter de compromettre la sécurité de la plateforme</li>
      <li>Utiliser le service pour envoyer des messages non sollicités (spam)</li>
      <li>Usurper l'identité d'un autre utilisateur ou créer de faux comptes</li>
    </ul>
    <p>
      SUPCHAT se réserve le droit de suspendre ou supprimer, sans préavis, tout compte ne respectant pas ces règles. Des poursuites judiciaires pourront être engagées en cas d'infractions graves.
    </p>
    
    <h2>5. Propriété intellectuelle</h2>
    <p>
      Les contenus publiés sur SUPCHAT restent la propriété de leurs auteurs. En partageant du contenu, vous :
    </p>
    <ul>
      <li>Garantissez disposer des droits nécessaires sur ce contenu</li>
      <li>Accordez à SUPCHAT une licence non-exclusive pour héberger et afficher ce contenu</li>
      <li>Acceptez que votre contenu puisse être visible par d'autres membres selon les paramètres de confidentialité que vous avez définis</li>
    </ul>
    <p>
      L'interface, les logos et la marque SUPCHAT sont protégés par le droit d'auteur et ne peuvent être utilisés sans autorisation préalable.
    </p>
    
    <h2>6. Espaces de travail et canaux</h2>
    <p>
      Les administrateurs d'espaces de travail sont responsables de :
    </p>
    <ul>
      <li>La modération des contenus publiés dans leur espace</li>
      <li>La gestion des membres et de leurs permissions</li>
      <li>Le respect des présentes CGU au sein de leur espace</li>
    </ul>
    <p>
      SUPCHAT se réserve le droit d'intervenir dans un espace de travail en cas de signalement ou de violation manifeste des CGU.
    </p>
    
    <h2>7. Modifications et résiliation</h2>
    <p>
      SUPCHAT se réserve le droit de modifier les présentes CGU à tout moment. Les utilisateurs seront informés des modifications majeures par email ou notification dans l'application. La continuation de l'utilisation du service après ces modifications vaut acceptation des nouvelles conditions.
    </p>
    <p>
      Vous pouvez résilier votre compte à tout moment depuis l'onglet Sécurité des paramètres. La suppression de votre compte entraînera la suppression de vos données personnelles conformément à notre politique de rétention.
    </p>
    
    <h2>8. Droit applicable et juridiction</h2>
    <p>
      Les présentes CGU sont régies par le droit français. Tout litige relatif à l'interprétation ou l'exécution des présentes sera soumis aux tribunaux compétents.
    </p>
    
    <h2>9. Contact</h2>
    <p>
      Pour toute question relative aux CGU ou à vos données personnelles, contactez l'administrateur du service à <a href="mailto:contact@supchat.fr" className="cgu-link">contact@supchat.fr</a>
    </p>
    
    <div className="cgu-footer">
      En utilisant SUPCHAT, vous reconnaissez avoir lu, compris et accepté les présentes Conditions Générales d'Utilisation.
    </div>
  </div>
);

export default CGU;

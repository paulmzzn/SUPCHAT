/**
 * Ce fichier est utilisé pour dédupliquer React dans l'application et éviter les erreurs de hooks.
 * Il crée un point central pour l'import de React, de ReactDOM et des hooks React.
 * Cela permet d'éviter les problèmes de multiples instances de React.
 */

import React from "react";
import ReactDOM from "react-dom";

// Exporter une instance unique de React
export { React, ReactDOM };

// Réexporter les hooks de React
export const {
  useState,
  useEffect,
  useContext,
  useReducer,
  useCallback,
  useMemo,
  useRef,
  useImperativeHandle,
  useLayoutEffect,
  useDebugValue,
} = React;

// Fonction utilitaire pour vérifier si React fonctionne correctement
export function checkReactHooks() {
  try {
    // Tenter d'utiliser useState (ce code n'est jamais exécuté, juste pour validation)
    const useStateFunc = React.useState;
    if (typeof useStateFunc !== "function") {
      console.error("React.useState n'est pas une fonction");
      return false;
    }
    return true;
  } catch (error) {
    console.error("Erreur lors de la vérification de React:", error);
    return false;
  }
}

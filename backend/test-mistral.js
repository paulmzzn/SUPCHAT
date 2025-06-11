import fetch from 'node-fetch';

const API_URL = 'http://localhost:3000';
const TEST_TOKEN = 'eyJhbGciOiJIUzI1NiIs...'; // Remplacer par un vrai token

// Test des nouvelles routes Mistral
async function testMistralRoutes() {
  console.log('🧪 Test des nouvelles routes Mistral avec historique...\n');

  try {
    // Test 1: Récupérer l'historique
    console.log('1. Test de récupération de l\'historique...');
    const historyResponse = await fetch(`${API_URL}/api/mistral/history?type=channel&canalId=test-canal-id&limit=5`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    if (historyResponse.ok) {
      const historyData = await historyResponse.json();
      console.log('✅ Historique récupéré:', historyData);
    } else {
      console.log('❌ Erreur historique:', historyResponse.status, await historyResponse.text());
    }

    // Test 2: Poser une question à Mistral dans un canal (simulation)
    console.log('\n2. Test de question Mistral dans un canal...');
    const channelResponse = await fetch(`${API_URL}/api/mistral/channel/test-canal-id/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify({
        question: 'Bonjour, peux-tu me rappeler de quoi on parlait ?',
        includeHistory: true,
        historyLimit: 10
      })
    });

    if (channelResponse.ok) {
      const channelData = await channelResponse.json();
      console.log('✅ Réponse canal:', channelData);
    } else {
      console.log('❌ Erreur canal:', channelResponse.status, await channelResponse.text());
    }

    // Test 3: Poser une question à Mistral en privé (simulation)
    console.log('\n3. Test de question Mistral en privé...');
    const privateResponse = await fetch(`${API_URL}/api/mistral/private/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${TEST_TOKEN}`
      },
      body: JSON.stringify({
        question: 'Salut ! On avait commencé à parler de quelque chose, tu t\'en souviens ?',
        includeHistory: true,
        historyLimit: 10
      })
    });

    if (privateResponse.ok) {
      const privateData = await privateResponse.json();
      console.log('✅ Réponse privée:', privateData);
    } else {
      console.log('❌ Erreur privé:', privateResponse.status, await privateResponse.text());
    }

  } catch (error) {
    console.error('❌ Erreur général:', error.message);
  }
}

// Test des routes existantes pour comparaison
async function testExistingRoutes() {
  console.log('\n🔍 Test des routes existantes...\n');

  try {
    // Test des routes utilisateurs
    const usersResponse = await fetch(`${API_URL}/api/users`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    console.log('Route /api/users:', usersResponse.ok ? '✅' : `❌ ${usersResponse.status}`);

    // Test des routes workspaces
    const workspacesResponse = await fetch(`${API_URL}/api/workspaces`, {
      headers: {
        'Authorization': `Bearer ${TEST_TOKEN}`
      }
    });
    
    console.log('Route /api/workspaces:', workspacesResponse.ok ? '✅' : `❌ ${workspacesResponse.status}`);

  } catch (error) {
    console.error('❌ Erreur routes existantes:', error.message);
  }
}

// Fonction principale
async function main() {
  console.log('🚀 Tests d\'intégration Mistral AI avec historique');
  console.log('=' .repeat(60));
  
  await testExistingRoutes();
  await testMistralRoutes();
  
  console.log('\n' + '=' .repeat(60));
  console.log('🏁 Tests terminés!');
}

// Exécuter les tests
main().catch(console.error);

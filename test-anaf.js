
async function testAnaf() {
  const cui = "14399840";
  const today = new Date().toISOString().split('T')[0];
  const url = 'https://webservicesp.anaf.ro/api/PlatitorTvaRest/v9/tva';
  
  console.log(`Testing CUI: ${cui} at ${url}`);
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ cui: parseInt(cui), data: today }])
    });
    
    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log(`Response: ${JSON.stringify(data, null, 2)}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
  }
}

testAnaf();

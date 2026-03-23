const shapefile = require('shapefile');
const path = require('path');

async function peek() {
  const shpPath = path.join(__dirname, '../blocuri_fizice_2025/blocuri_fizice.shp');
  const dbfPath = path.join(__dirname, '../blocuri_fizice_2025/blocuri_fizice.dbf');

  console.log('Peeking into:', shpPath);
  
  try {
    const source = await shapefile.open(shpPath, dbfPath);
    let i = 0;
    while (i < 10) {
      const result = await source.read();
      if (result.done) break;
      console.log(`Record ${i} properties:`, JSON.stringify(result.value.properties));
      i++;
    }
  } catch (err) {
    console.error('Error reading shapefile:', err);
  }
}

peek();

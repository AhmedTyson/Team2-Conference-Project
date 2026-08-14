const fs = require('fs');
const path = require('path');

const base = 'fullstack/Frontend/assets/js/pages';

const patches = [
  { file: 'hotels.js',              type: 'hotel' },
  { file: 'hotel-details.js',       type: 'hotel' },
  { file: 'restaurants.js',         type: 'restaurant' },
  { file: 'restaurant-details.js',  type: 'restaurant' },
  { file: 'attractions.js',         type: 'attraction' },
  { file: 'attraction-details.js',  type: 'attraction' },
  { file: 'destinations.js',        type: 'destination' },
  { file: 'destination-details.js', type: 'destination' },
];

const OLD = 'Ui.bindImage(img)';

patches.forEach(function(p) {
  const full = path.join(base, p.file);
  let content = fs.readFileSync(full, 'utf8');
  const NEW = 'Ui.bindImage(img, \'' + p.type + '\')';
  if (content.indexOf(OLD) !== -1) {
    content = content.split(OLD).join(NEW);
    fs.writeFileSync(full, content, 'utf8');
    console.log('Patched: ' + p.file);
  } else {
    console.log('Not found in: ' + p.file);
  }
});
console.log('All done.');

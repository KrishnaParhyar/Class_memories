const fs = require('fs');
const path = require('path');

const studentsFile = path.join(__dirname, 'students.json');

function saveStudents(students) {
  try {
    fs.writeFileSync(studentsFile, JSON.stringify(students, null, 2));
    console.log('Saved students.json');
  } catch(e) {
    console.error('Save failed:', e);
  }
}

module.exports = { saveStudents };

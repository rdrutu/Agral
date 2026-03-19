const fs = require('fs');
let content = fs.readFileSync('src/lib/actions/support.ts', 'utf8');

content = content.replace(/Aceast[^\"]*nchis[^\"]*/g, 'Această conversație a fost închisă.');
content = content.replace(/Se caut[^\"]*moderator disponibil\.\.\./g, 'Se caută un moderator disponibil...');
content = content.replace(/Salut, sunt[^\"]*venit s[^\"]*te ajut!/g, 'Salut, sunt ${user.firstName ?? "Moderatorul"} și am venit să te ajut!');

fs.writeFileSync('src/lib/actions/support.ts', content, 'utf8');
console.log('Fixed encoding in support.ts');
const fs = require('fs');

const files = [
    'src/screens/existing/PatientHistory.jsx',
    'src/screens/existing/PatientSearch.jsx',
    'src/screens/new/DepartmentSelection.jsx',
    'src/screens/new/DoctorSelection.jsx',
    'src/screens/new/UpiPayment.jsx'
];

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    
    // Bubble width 380px -> 290px
    content = content.replace(/width: '380px'/g, "width: '290px'");
    
    // Bubble padding 24px -> 16px
    content = content.replace(/padding: '24px'/g, "padding: '16px'");
    
    // Bubble left to -4px to make it flush
    content = content.replace(/left: '20px',\\s*marginBottom:/g, "left: '-4px',\\n        marginBottom:");
    
    // Bot icon size
    content = content.replace(/fontSize: '3.5rem'/g, "fontSize: '3rem'");
    
    // Bot container position
    content = content.replace(/left: '20px', zIndex:/g, "left: '16px', zIndex:");
    
    // Text size
    content = content.replace(/fontSize: '0.95rem'/g, "fontSize: '0.9rem'");
    
    fs.writeFileSync(file, content);
});

console.log('Styles updated successfully.');

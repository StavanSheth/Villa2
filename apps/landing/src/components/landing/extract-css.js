const fs = require('fs');
const path = require('path');

const filePath = 'c:/Projects/Mavon/Clients/reposit-solar/discovery/apps/landing/src/components/landing/Preloader.tsx';
const cssPath = 'c:/Projects/Mavon/Clients/reposit-solar/discovery/apps/landing/src/components/landing/Preloader.css';

let content = fs.readFileSync(filePath, 'utf8');

const searchStr = 'const StyledWrapper = styled.div`';
const idx = content.indexOf(searchStr);

if (idx !== -1) {
  const endIdx = content.lastIndexOf('`;');
  if (endIdx > idx) {
    const cssContent = content.substring(idx + searchStr.length, endIdx);
    
    // Write CSS file
    fs.writeFileSync(cssPath, '.preloader-wrapper {' + cssContent + '\n}', 'utf8');
    console.log('Created Preloader.css');

    // Replace styled-components with standard CSS import
    content = content.replace(/import styled from 'styled-components';/, 'import \'./Preloader.css\';');
    content = content.replace(/<StyledWrapper>/g, '<div className=\"preloader-wrapper\">');
    content = content.replace(/<\/StyledWrapper>/g, '</div>');
    
    // Remove the StyledWrapper definition
    content = content.substring(0, idx);

    fs.writeFileSync(filePath, content, 'utf8');
    console.log('Updated Preloader.tsx');
  } else {
    console.log('Could not find end of CSS block');
  }
} else {
  console.log('Already refactored?');
}

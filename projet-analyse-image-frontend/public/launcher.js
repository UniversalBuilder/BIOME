// App Launcher Utility
// This simple script allows launching the app in either web or desktop mode

const launchApp = (mode) => {
  if (mode !== 'web' && mode !== 'desktop') {
    console.error('Invalid mode. Use "web" or "desktop"');
    return;
  }
  
  console.log(`Launching BIOME in ${mode} mode...`);
  
  if (mode === 'web') {
    // Launch in browser
    window.open('http://localhost:3000', '_blank');
  } else {
    // Launch desktop app
    // If Tauri app is installed with custom protocol, this should work
    window.open('biome://', '_blank');
  }
};

// Add buttons to the document
document.addEventListener('DOMContentLoaded', () => {
  const container = document.createElement('div');
  container.style.textAlign = 'center';
  container.style.marginTop = '50px';
  
  const title = document.createElement('h1');
  title.textContent = 'BIOME App Launcher';
  container.appendChild(title);
  
  const subtitle = document.createElement('p');
  subtitle.textContent = 'Choose which version of BIOME to launch:';
  container.appendChild(subtitle);
  
  const webButton = document.createElement('button');
  webButton.textContent = 'Launch Web Version';
  webButton.style.margin = '10px';
  webButton.style.padding = '10px 20px';
  webButton.style.fontSize = '16px';
  webButton.style.backgroundColor = '#4CAF50';
  webButton.style.color = 'white';
  webButton.style.border = 'none';
  webButton.style.borderRadius = '5px';
  webButton.style.cursor = 'pointer';
  webButton.onclick = () => launchApp('web');
  container.appendChild(webButton);
  
  const desktopButton = document.createElement('button');
  desktopButton.textContent = 'Launch Desktop Version';
  desktopButton.style.margin = '10px';
  desktopButton.style.padding = '10px 20px';
  desktopButton.style.fontSize = '16px';
  desktopButton.style.backgroundColor = '#2196F3';
  desktopButton.style.color = 'white';
  desktopButton.style.border = 'none';
  desktopButton.style.borderRadius = '5px';
  desktopButton.style.cursor = 'pointer';
  desktopButton.onclick = () => launchApp('desktop');
  container.appendChild(desktopButton);
  
  document.body.appendChild(container);
});

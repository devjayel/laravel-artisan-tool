import { useEffect, useState } from 'react';
import Home from "@/Pages/Home";

function App() {
  const [artisanCommand, setArtisanCommand] = useState([]);

  useEffect(() => {
    window.electron.ipcRenderer.on('data-response', (event, data) => {
      setArtisanCommand(data);
      console.log(data);
    });

    window.electron.ipcRenderer.send('get-all');
  }, []);



  return <Home artisanCommand={artisanCommand} />;
}

export default App;
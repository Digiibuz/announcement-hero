
import React from "react";
import { HashRouter } from "react-router-dom";

function App() {
  console.log("App with HashRouter is rendering");

  return (
    <HashRouter>
      <div style={{ padding: "20px", backgroundColor: "white", color: "black" }}>
        <h1>Test App avec HashRouter</h1>
        <p>Si vous voyez ceci, HashRouter fonctionne !</p>
      </div>
    </HashRouter>
  );
}

export default App;

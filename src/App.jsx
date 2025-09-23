// App.js
import React from 'react';
import MongoIdScanner from './mongo';
import MongoQRApp from './mongo';
import ObjectIdQRCode from './mongo';
import MongoTextGrid from './mongo';
import MongoQRCodeGenerator from './login';

function App() {
  return (
    <>
      <MongoTextGrid />
      <MongoQRCodeGenerator />
    </>
  );
}

export default App;
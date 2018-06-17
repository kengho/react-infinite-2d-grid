import React, { Component } from 'react';
import { render } from 'react-dom';

import Demo from '../../src/Demo';

class App extends Component {
  render() {
    return <Demo />;
  }
}

render(<App />, document.querySelector('#demo'));

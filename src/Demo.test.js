import React from 'react';
import ReactDOM from 'react-dom';

import Demo from './Demo';

it('renders without crashing', () => {
  ReactDOM.render(<Demo />, document.createElement('div'));
});

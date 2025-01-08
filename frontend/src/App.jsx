import React from 'react';
import { BrowserRouter as Router, Route, Switch } from 'react-router-dom';
import Login from './pages/login';

const App = () => {
  return (
    <Router>
      <Switch>
        <Route path="/login" component={Login} />
        <Route path="/" component={Home} />
      </Switch>
    </Router>
  );
};

const Home = () => (
  <div>
    <h1>Welcome to SUPCHAT</h1>
    <p>This is the home page.</p>
  </div>
);

export default App;

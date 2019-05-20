import 'babel-polyfill';
import React from 'react';
import { render } from 'react-dom';
import App from './components/main.jsx';

render(
  <App/>,
  document.getElementById('root')
);

const imageName = 'image1';

// fetch(`http://localhost:4444/api/symbolic-images`, {
//   method: 'GET',
// })
//   .then((response) => {
//     console.log(response.headers.get('Content-Type'));
//     console.log(response.headers.get('Date'));
//     console.log(response.status);
//     console.log(response.statusText);
//     console.log(response.type);
//     console.log(response.url);
//     return response.json();
//   })
//   .then((res) => {
//     console.log(res);
//   });
//
// fetch(`http://localhost:4444/api/symbolic-images/${imageName}?offset=4000&limit=1000`, {
//   method: 'GET',
// })
//   .then((response) => {
//     console.log(response.headers.get('Content-Type'));
//     console.log(response.headers.get('Date'));
//     console.log(response.status);
//     console.log(response.statusText);
//     console.log(response.type);
//     console.log(response.url);
//     return response.json();
//   })
//   .then((res) => {
//     console.log(res);
//   });
//
// fetch(`http://localhost:4444/api/symbolic-images`, {
//   method: 'POST',
//   headers: {
//     'Accept': 'application/json',
//     'Content-Type': 'application/json',
//   },
//   body: JSON.stringify({
//     xFunction: '0.6 + 0.9*(x*cos(0.4 - 6/(1+x*x+y*y)) - y*sin(0.4 - 6/(1+x*x+y*y)))',
//     yFunction: '0.9*( x*sin(0.4 - 6/(1+x*x+y*y)) + y*cos(0.4 - 6/(1+x*x+y*y)))',
//     startX: -2,
//     startY: -2,
//     diameter: 2,
//     width: 2,
//     height: 2,
//     iterations: 5,
//     name: 'image4'
//   }),
// })
//   .then((res) => console.log(res));

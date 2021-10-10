import React from 'react'
import ReactDOM from 'react-dom'
import { GlobalStyle } from './GlobalStyle'
import { Popup } from './Popup'

ReactDOM.render(
  <React.Fragment>
    <GlobalStyle />
    <Popup />
  </React.Fragment>,
  document.querySelector('#root')
)

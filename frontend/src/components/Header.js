import React from 'react'
import { Link } from 'react-router-dom'
import logo from '../logo.svg';
import './App.css'

// The Header creates links that can be used to navigate
// between routes.
class Header extends React.Component {

  constructor(){
    super()
    var showNav = false
    if(localStorage.getItem('token') && localStorage.getItem('token')!='')
      showNav = true
    else 
      showNav = false
    this.state = {
      showNav: showNav
    }
    console.log(this.state)
  }

  render() {
    return (
    <div className = "App">
  <header className="App-header">
          <img src={logo} className="App-logo" alt="logo" />
          <h1 className="App-title">Welcome to POS Software</h1>
    <div>
        <button hidden={!this.state.showNav}><Link to='/sale'>Sale Point</Link></button>
        <button hidden={!this.state.showNav}><Link to='/modifySKU'>Modify Stocks</Link></button>
      
    </div>
  </header>
  </div>
    )}
}

export default Header

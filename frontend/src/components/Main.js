import React from 'react'
import { Switch, Route } from 'react-router-dom'
import Home from './Home'
import Sale from './Sale'
import ModifySKU from './ModifySKU'

const Main = () => (
  <main>
    <Switch>
      <Route exact path='/' component={Home}/>
      <Route path='/sale' component={Sale}/>
      <Route path='/modifySKU' component={ModifySKU}/>
    </Switch>
  </main>
)

export default Main

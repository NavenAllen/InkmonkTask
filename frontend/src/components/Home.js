import React, { Component } from 'react';
import axios from 'axios';
import Modal from 'react-modal'
import {Redirect} from 'react-router'
import './App.css'; import './StockUnit.css';

const customStyles = {
  content : {
    top                   : '50%',
    left                  : '50%',
    right                 : 'auto',
    bottom                : 'auto',
    marginRight           : '-50%',
    transform             : 'translate(-50%, -50%)'
  },
  
};

Modal.setAppElement('#root');

class Home extends Component {

  constructor() {
    super()
    var redirect = false
    if(localStorage.getItem('token') && localStorage.getItem('token')!='')
      redirect = true
    else 
      redirect = false
    this.state = {
      credentials: {},
      modalIsOpen: false,
      redirect: redirect
    };
  
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this);
    this.handleChange = this.handleChange.bind(this);
    this.handleSubmit = this.handleSubmit.bind(this);
    this.login = this.login.bind(this);
  }

  openModal() {
    this.setState({ credentials:{} });
    
        this.setState({modalIsOpen: true});
      }
    
  closeModal() {
        this.setState({modalIsOpen: false});
  }
  
  handleChange(evt)  {
        
            const newCredentials = this.state.credentials;
            newCredentials[evt.target.name] = evt.target.value
        
            this.setState({ credentials:newCredentials });
        
            
  }

  handleSubmit= () => {
    
        axios
        .post("http://localhost:5000/api/register", this.state.credentials)
        .then(response => {

          this.setState({credentials:{}})
    
    
        })
        .catch( error => console.log(error))
    
  }

  login= () => {
    
        axios
        .get("http://localhost:5000/api/token", {auth: this.state.credentials})
        .then(response => {
          console.log(response.data)

          localStorage.setItem('token',response.data.token)
          this.setState({credentials:{}, redirect:true})
    
    
        })
        .catch( error => console.log(error))
    
  }
        
  render() {
    if (this.state.redirect === true) {
      return <Redirect to='/sale' />
    }
    return (
      
      <div className="Home">
      <br/>
          <br/>
        <label for="username">Username</label>&emsp;
        <input type="text" name="username" value = {this.state.credentials.username}  onChange={this.handleChange}/>
        <br/>
        <label for="password">Password</label>&emsp;
        <input type="password" name="password" value={this.state.credentials.password} onChange={this.handleChange}/>
        <br/>
          <br/>
        <div className="inlineView">
        <button onClick={this.login}> Login </button> &emsp;
        <button onClick={this.openModal}> Register </button>
        <Modal
          isOpen={this.state.modalIsOpen}
          onRequestClose={this.closeModal}
          style={customStyles}
          contentLabel="Example Modal"
        >
           <label for="username">Username</label> 
          <input type="text" name="username" value={this.state.credentials.username} onChange={this.handleChange}/>
          <br/>
          <label for="password">Password</label>
          <input type="password" name="password" value={this.state.credentials.password} onChange={this.handleChange}/>
          <br/>
          <br/>

          
          
          <button onClick={(e) => {this.handleSubmit(); this.closeModal()}}>Submit</button>
        </Modal>
        </div>
      </div>
    );
  }
}

export default Home;

import React, { Component } from 'react';
import axios from 'axios';
import './App.css'; import './StockUnit.css';
import {Redirect} from 'react-router'
import Popup from 'reactjs-popup'
import Modal from 'react-modal'

const customStyles = {
    content : {
      top                   : '50%',
      left                  : '50%',
      right                 : 'auto',
      bottom                : 'auto',
      marginRight           : '-50%',
      transform             : 'translate(-50%, -50%)'
    }
  };
  
  Modal.setAppElement('#root');
  



class ModifySKU extends Component {

    constructor(){
        super()
        var auth = {}
        auth['username'] = localStorage.getItem('token')
        auth['password'] = undefined
        this.state = {
            stockUnits: [],
            modalIsOpen: false,
            toUpdateUnit: {},
            auth: auth
        };
        
        this.openModal = this.openModal.bind(this);
        this.closeModal = this.closeModal.bind(this)
        this.handleUpdateChange = this.handleUpdateChange.bind(this);
    }

    openModal(id) {
        this.setState({modalIsOpen: true, toUpdateUnit: this.state.stockUnits[id]});
      }

    openNewUnitModal() {
        this.setState({modalIsOpen: true, toUpdateUnit: {"new":1}});
    }
    
      closeModal() {
        this.setState({modalIsOpen: false, toUpdateUnit:{}});
      }
  
  componentDidMount() {
    axios
    .get("http://localhost:5000/api/stocks/get", {auth:this.state.auth})
    .then(response => {

      console.log(response.data);

      var stockUnits = response.data.StockUnits;
      
      for (var i=0; i<stockUnits.length; i++)
        stockUnits[i].quantity = 0

      const newState = Object.assign({}, this.state, {
        stockUnits: stockUnits
      });

      this.setState(newState);

      console.log(this.state)

    })
    .catch( error => {
      console.log(error.response)
      if(error.response.status === 401){
        
                localStorage.setItem('token', '')
                this.setState({toLogin:true})
        
              }
    })
  }

  handleQuantityChange = (id) => (evt) => {
    const newStockUnits = this.state.stockUnits.map((stock, sid) => {
      if (id !== sid) return stock;
      return { ...stock, quantity: parseInt(evt.target.value) };
    });

    this.setState({ stockUnits: newStockUnits });
    console.log(this.state.stockUnits)
  }

  handleUpdateChange(evt)  {

    const newUpdateUnit = this.state.toUpdateUnit;
    newUpdateUnit[evt.target.name] = evt.target.value

    this.setState({ toUpdateUnit:newUpdateUnit });

    console.log(this.state.toUpdateUnit)
    
  }

  increaseStock = (id, stock_id) => {
      console.log({"id":id, "quantity":this.state.stockUnits[id].quantity})
    axios
    .post("http://localhost:5000/api/stocks/increase", {"id":stock_id, "quantity":this.state.stockUnits[id].quantity}, {auth: this.state.auth})
    .then(response => {
        console.log(response.data)
        const newStockUnits = this.state.stockUnits.map((stock) => {
            if (stock_id !== stock.id) return stock;
            return { ...stock, stock: response.data.updatedStockUnit.stock };
          })

          this.setState({stockUnits:newStockUnits})
    })
    .catch( error =>{
      if(error.response.status === 401){
        
                localStorage.setItem('token', '')
                this.setState({toLogin:true})
        
              }
    })

  }

  handleSubmit = () => {

    axios
    .post("http://localhost:5000/api/stocks/new", this.state.toUpdateUnit, {auth:this.state.auth})
    .then(response => {
        console.log(response.data)
        const newStockUnits = this.state.stockUnits;
        newStockUnits.push(response.data.newStockUnit)

        this.setState({stockUnits:newStockUnits})
    })
    .catch( error => {
      if(error.response.status === 401){
        
                localStorage.setItem('token', '')
                this.setState({toLogin:true})
        
              }
    })

  }

  

  render() {
    if (this.state.toLogin === true) {
      return <Redirect to='/' />
    }
    return (
      <div className="ModifySKU">

        <div className="StockUnit" >
            <div className="StockUnitChild">
              <span>Name</span>
            </div>
            <div className="StockUnitChild">
              <span>Price</span>
            </div>
            <div className="StockUnitChild">
              <span>Stock</span>
            </div>
        
            </div>
          {this.state.stockUnits.map((stock, id) => (        
            <div className="StockUnit">
              <div className="StockUnitChild">
              <span>{stock.name}</span>
              </div>
              <div className="StockUnitChild">
              <span>{stock.price}</span>
              </div>
              <div className="StockUnitChild">
              <span>{stock.stock}</span>
              </div>
              <div className="StockUnitChild">
              <Popup trigger={<button> Add stock </button>} position="right center">
              {close => (
                  <div>
                <input type="number" name={stock.id} min="0" max = {stock.stock} value={stock.quantity} onChange={this.handleQuantityChange(id)}/>
                <button onClick={(e) => { this.increaseStock(id,stock.id); close()}}>Add</button>
                </div>
              )}
                </Popup>
                </div>
            </div>
          ))}
          <Modal
          isOpen={this.state.modalIsOpen}
          onRequestClose={this.closeModal}
          style={customStyles}
          contentLabel="Example Modal"
        >
          <label for="name">Name</label>&emsp;
          <input type="text" name="name" value={this.state.toUpdateUnit.name} onChange={this.handleUpdateChange}/>
          <br/>
          <label for="price">Price</label>&emsp;
          <input type="number" name="price" value={this.state.toUpdateUnit.price} onChange={this.handleUpdateChange}/>
          <br/>          
          <label for="stock">Initial Stock</label>&emsp;
          <input type="number" name="stock" value={this.state.toUpdateUnit.stock} onChange={this.handleUpdateChange}/>
          <br/>          
          <label for="discount">Discount Percentage</label>&emsp;
          <input type="number" name="discount" value={this.state.toUpdateUnit.discount} onChange={this.handleUpdateChange}/>
          <br/>
          <label for="tax_percent">Tax Percentage</label>&emsp;
          <input type="number" name="tax_percent" value={this.state.toUpdateUnit.tax_percent} onChange={this.handleUpdateChange}/>
          <br/>
          <br/>          
          
          <button onClick={(e) => {this.handleSubmit(); this.closeModal()}}>Submit!</button>
        </Modal>
        <button class="primary" onClick={(e) => {this.openNewUnitModal()}}> Add New Item </button>
      </div>
    );
  }
}

export default ModifySKU;

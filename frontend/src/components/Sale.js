import React, { Component } from 'react';
import axios from 'axios';
import './App.css'; import './StockUnit.css';
import Modal from 'react-modal'
import {Redirect} from 'react-router'

import ReactTable from "react-table";
import "react-table/react-table.css"; 

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

class Sale extends Component {

  constructor(){
    super();

    var auth = {}
    auth['username'] = localStorage.getItem('token')
    auth['password'] = undefined

    this.state = {
      stockUnits: [],
      modalIsOpen: false,
      salesInvoice: [],
      recentTotalCost: 0,
      auth: auth,
      toLogin:false
    };

    console.log(this.state.toLogin)
    
    console.log(this.state.auth)
    this.openModal = this.openModal.bind(this);
    this.closeModal = this.closeModal.bind(this)
  }

  createQuantityVariable () {
    var stockUnits = this.state.stockUnits;
    
    for (var i=0; i<stockUnits.length; i++)
      stockUnits[i].quantity = 0

    const newState = Object.assign({}, this.state, {
      stockUnits: stockUnits
    });

    this.setState(newState);

    
  }

  openModal() {

    this.setState({modalIsOpen: true});
  }

  closeModal() {
    this.createQuantityVariable()
    this.setState({modalIsOpen: false});
  }

  componentDidMount() {
    axios
    .get("http://localhost:5000/api/stocks/get", {auth: this.state.auth})
    .then(response => {


      console.log(response.data);

      var stockUnits = response.data.StockUnits;

      const newState = Object.assign({}, this.state, {
        stockUnits: stockUnits
      });

      this.setState(newState);

      this.createQuantityVariable();
    

    })
    .catch( error => {
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
  }

  handleSubmit = (evt) => {
    evt.preventDefault();

    axios
    .post("http://localhost:5000/api/stocks/sale", {"skus":this.state.stockUnits}, {auth:this.state.auth})
    .then(response => {

      var newStockUnits = response.data.updatedStockUnits;
      var salesInvoice = response.data.salesInvoice
      var recentTotalCost = response.data.totalCost

      console.log(recentTotalCost)


      this.setState({ stockUnits: newStockUnits , salesInvoice:salesInvoice, modalIsOpen:true, recentTotalCost:recentTotalCost});

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
      <div className="Sale">

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
            <div className="StockUnitChild">
              <span>Enter Quantity</span>
            </div>
            
            <br/>
            </div>
          
          {this.state.stockUnits.map((stock, id) => (        
            <div className="StockUnit" >
            <div className="StockUnitChild">
              <span>{stock.name}</span>
            </div>
            <div className="StockUnitChild">
              <span>{stock.price}₹</span>
            </div>
            <div className="StockUnitChild">
              <span>{stock.stock}</span>
            </div>
              <input type="number" className="StockUnitInput" name={stock.id} value={stock.quantity} onChange={this.handleQuantityChange(id)}/>
            <br/>
            </div>
          ))}
          <button onClick={this.handleSubmit}> Check out </button>
        <Modal
          isOpen={this.state.modalIsOpen}
          onRequestClose={this.closeModal}
          style={customStyles}
          contentLabel="Example Modal"
        >
          <p>Total Cost = {this.state.recentTotalCost}</p>
          <ReactTable
            data={this.state.salesInvoice}
          columns={[
            {
              Header: "Name",
              accessor: "name"
            },
            {
              Header: "Price",
              accessor: "price"
            },
            {
              Header: "Quantity",
              accessor: "quantity"
            },
            {
              Header: "Cost",
              accessor: "cost"
            }
          ]}
          className="-striped -highlight"
          minRows = {0}
        />
        </Modal>

      </div>
    );
  }
}

export default Sale;

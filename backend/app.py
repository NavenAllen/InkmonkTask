from datetime import datetime
import json
from flask import Flask, request, jsonify, make_response, flash, url_for, redirect,  render_template, abort, g
from itsdangerous import (TimedJSONWebSignatureSerializer
                          as Serializer, BadSignature, SignatureExpired)
from passlib.apps import custom_app_context as pwd_context
from flask_sqlalchemy import SQLAlchemy
from flask_cors import CORS 
from marshmallow import Schema, fields
from flask_httpauth import HTTPBasicAuth



app = Flask(__name__)
app.config.from_pyfile('app.cfg')
CORS(app)
db = SQLAlchemy(app)
auth = HTTPBasicAuth()


class StockDetails(db.Model):
    __tablename__ = 'stock_details'
    id = db.Column('sku_id', db.Integer, primary_key=True)
    name = db.Column(db.String(60))
    price = db.Column(db.Integer)
    stock = db.Column(db.Integer)
    discount = db.Column(db.Float)
    tax_percent = db.Column(db.Float)
    weighted = db.Column

    def __init__(self, name, price, stock=0, discount=0, tax_percent=0):
        self.name = name
        self.price = price
        self.stock = stock
        self.discount = discount/100.0
        self.tax_percent = tax_percent/100.0

class User(db.Model):
    __tablename__ = 'users'
    id = db.Column(db.Integer, primary_key = True)
    username = db.Column(db.String(32), index = True)
    password_hash = db.Column(db.String(128))

    def __init__(self, username):
        self.username = username

    def hash_password(self, password):
        self.password_hash = pwd_context.encrypt(password)

    def verify_password(self, password):
        return pwd_context.verify(password, self.password_hash)
    
    def generate_auth_token(self, expiration = 600):
        s = Serializer(app.config['SECRET_KEY'], expires_in = expiration)
        return s.dumps({ 'id': self.id })

    @staticmethod
    def verify_auth_token(token):
        s = Serializer(app.config['SECRET_KEY'])
        try:
            data = s.loads(token)
        except SignatureExpired:
            return None # valid token, but expired
        except BadSignature:
            return None # invalid token
        user = User.query.get(data['id'])
        return user

    

class StockDetailsSchema(Schema):
    id = fields.Integer()
    name = fields.Str()
    price = fields.Integer()
    stock = fields.Integer()
    discount = fields.Float()
    tax_percent = fields.Float()
    cost = fields.Float()

class SalesInvoiceSchema(Schema):
    name = fields.Str()
    quantity = fields.Integer()
    discount = fields.Float()
    tax = fields.Float()
    cost = fields.Float()

db.create_all()

@app.errorhandler(401)
def unauthorized():
    return make_response(jsonify({'success':False,'error': 'Unauthorized access'}), 200)

@auth.verify_password
def verify_password(username_or_token, password):
    user = User.verify_auth_token(username_or_token)
    if not user:
        user = User.query.filter_by(username = username_or_token).first()
        if not user or not user.verify_password(password):
            return False
    g.user = user
    return True

@app.route('/api/token')
@auth.login_required
def get_auth_token():
    token = g.user.generate_auth_token()
    return jsonify({ 'success':True,'token': token.decode('ascii') })

def make_public_detail(sku):
    new_detail = {}
    for field in sku:
            new_detail[field] = sku[field]
    return new_detail




@app.route('/api/register', methods = ['POST'])
def new_user():
    username = request.json.get('username')
    password = request.json.get('password')
    if username is None or password is None:
        abort(400) # missing arguments
    if User.query.filter_by(username = username).first() is not None:
        abort(400) # existing user
    user = User(username = username)
    user.hash_password(password)
    db.session.add(user)
    db.session.commit()
    return jsonify({ 'success':True,'username': user.username }), 201

@app.route('/api/stocks/get', methods=['GET'])
@auth.login_required
def get_all_skus():
    skus = StockDetails.query.all()
    return jsonify({"success": True, "StockUnits":StockDetailsSchema(many=True).dump(skus)})

@app.route('/api/stocks/increase', methods=['POST'])
@auth.login_required
def increase_stock():
    if not request.json or not 'id' in request.json or not 'quantity' in request.json:
        abort(400)
    update_sku = db.session.query(StockDetails).filter_by(id=request.json['id']).one()
    update_sku.stock += request.json['quantity']
    db.session.commit()
    return jsonify( { 'success': True, "updatedStockUnit":StockDetailsSchema().dump(update_sku) } ), 200


@app.route('/api/stocks/new', methods=['POST'])
@auth.login_required
def new_sku():
    if not request.json or not 'name' in request.json or not 'price' in request.json or not 'stock' in request.json or not 'discount' in request.json or not 'tax_percent' in request.json:
       abort(400) 
    sku = StockDetails(request.json['name'].encode('ascii','ignore'), request.json['price'].encode('ascii','ignore'), request.json['stock'].encode('ascii','ignore'), int(request.json['discount'].encode('ascii','ignore')), int(request.json['tax_percent'].encode('ascii','ignore')))
    db.session.add(sku)
    db.session.commit()
    return jsonify( { 'success': True, "newStockUnit":StockDetailsSchema().dump(sku) } ), 201


@app.route('/api/stocks/sale', methods=['POST'])
@auth.login_required
def sale_done():
    if not request.json or not 'skus' in request.json:
        abort(400)
    skus_list = request.json['skus']
    salesInvoice = []
    total_cost = 0.0
    
    for sku in skus_list:
        if not 'id' in sku or not 'quantity' in sku:
            abort(400)

        if sku['quantity'] :

            update_sku = db.session.query(StockDetails).filter_by(id=sku['id']).one()
            update_sku.stock -= sku['quantity']
            db.session.commit()

            cost = sku['price']*sku['quantity']
            tax = cost*sku['tax_percent']
            discount = cost*sku['discount']
            cost += tax - discount
            sku['stock']-= sku['quantity']

            total_cost +=cost

            salesInvoice.append({"name":sku['name'],
                    "quantity":sku['quantity'],
                    "cost":cost,
                    "tax":tax,
                    "discount":discount
                    })

    return jsonify( { 'success': True, 
        'updatedStockUnits':StockDetailsSchema(many=True).dump(skus_list), 
        'salesInvoice':SalesInvoiceSchema(many=True).dump(salesInvoice),
        'totalCost':total_cost
        } ), 200


if __name__ == '__main__':
    app.run()

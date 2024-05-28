require("dotenv").config();
const mongoose = require("mongoose")
const express = require("express")
const cors = require("cors")
const connectDb = require("./db")
const Jwt = require("jsonwebtoken")
const stripe = require("stripe")(process.env.STRIPE_SECRET);

const app = express()
app.use(express.json()) 
app.use(express.urlencoded())
app.use(cors())

// checkout api for stripe
app.post("/api/create-checkout-session",async(req,res)=>{
    const {products} = req.body;


    const lineItems = products.map((product)=>({
        price_data:{
            currency:"inr",
            product_data:{
                name:product.dishName,
                images:[product.imgdata]
            },
            unit_amount:product.price * 100,
        },
        quantity:product.qnty
    }));

    const session = await stripe.checkout.sessions.create({
        payment_method_types:["card"],
        line_items:lineItems,
        mode:"payment",
        success_url:"http://localhost:3000",
        cancel_url:"http://localhost:3000/cancel",
    });

    res.json({id:session.id})
 
})


//JWT
const SECRET_KEY = "samir"



// schema for register  data 
const DataSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String
})

const Data = new mongoose.model("data", DataSchema);

//token schema
const TokenSchema = new mongoose.Schema({
    userId:{
        type:mongoose.Schema.Types.ObjectId,
        required:true, 
    },

    token:String,
    expiredAt:Date,
})
TokenSchema.index({expiresAt:1},{expireAfterSeconds:0})
const Token = new mongoose.model("token", TokenSchema);


//  Routes  for Register
app.post("/register", async (req, res) => {

    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(422).json({ error: "please fill all fields!" })
        }

        const usersame = await Data.findOne({email})

        if(usersame){
            return res.status(422).json({error:"Email already registered!"})     
        } 
        else{
            // const hashedPassword = await bcrypt.hash(password,5)
            const data = new Data({name,email, password});
            await data.save();
            res.status(201).json({message:"Register successfully!"})
        }

    } catch (error) {
        console.log(error)
    }

})


// Routes for login

app.post("/login", async (req, res) => {

    try {
        const { email, password } = req.body;

        const usersame = await Data.findOne({ email,password })
        // const usersamePassword =  await bcrypt.compare(password,usersame.password)
      
        if(!usersame){  
          return res.status(422).json({ error: "user not registered" });
        }
               
        else {
            const token = Jwt.sign({userId:usersame._id},SECRET_KEY)
            const expiredAt= new Date(Date.now()+(60*60*1000))
           const tokenSave = new Token({
            userId:usersame._id,
            token,
            expiredAt,

           })
           const username = usersame.email

           await tokenSave.save()
            res.status(201).json({ message: "Login successfully!","email":username ,token}) ;  
        }

    } catch (error) {
        console.log(error)
    }

})


//logout
app.post("/logout", async (req, res) => {
    const  token = req.body.token;
    try{
        const logout = await Token.findOneAndDelete ({token}) 
        if(!logout){
            return res.status(422).json({ error: "email not found" });
        }else{
            return res.status(201).json({ message: "logout success"}) ;
        }
    }catch(error){
        console.log(error)
    }

})



//checkToken
app.post("/token", async (req, res) => {
    const  token = req.body.token;
    try{
        const tokenCheck = await Token.findOne({token}) 
        if(!tokenCheck){
            return res.status(422).json({ error: "token not found" });
        }else{
            return res.status(201).json({ message: "token available"}) ;
        }
    }catch(error){
        console.log(error)
    }

})


connectDb();

app.listen(5000, () => {
    console.log("be started backend")
})


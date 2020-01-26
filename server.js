'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns');

var cors = require('cors');
var bodyParser = require('body-parser');

var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
// mongoose.connect(process.env.MONGOLAB_URI);

mongoose.connect(process.env.URL);

app.use(cors());
app.use(bodyParser.urlencoded({'extended': false}));

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

const regex = /(^\w+):\/+www./g;

// console.log('https://www.freecodecamp.org/forum/'.replace(regex, '').match(/\w+.\w+/));

const urlSchema = new mongoose.Schema({
  original_url: String,
  short_url: Number
});

const urlModel = mongoose.model('urlModel', urlSchema);

app.post('/api/shorturl/new', (req,res) => {
  if(regex.test(req.body.url) !== true) res.json({error: 'invalid URL'});
  
  const url = req.body.url.replace(regex, '').match(/\w+.\w+/)[0];
  
  dns.lookup(url, async (err,address,family) => {
    if(err) return console.log(err);
    if(address === undefined) res.json({error: 'invalid URL'});
    var counter = 1;
    
    const recentEntry = await getAllEntries();
     
    if(recentEntry[0] !== undefined) counter = recentEntry[0]['short_url'] + 1;

     const entry = new urlModel({original_url: req.body.url, short_url: counter});
     entry.save( (err,response) => {
        if(err) return console.log(err);
     });
     res.json({original_url: req.body.url, short_url: counter});
    
  });
});

app.get('/api/shorturl/:id', async (req,res) => {
  const data = await getEntryById(req.params.id);
  if(data[0] === undefined) return res.json({error: 'No short url found for given input'});
  res.redirect(data[0]['original_url']);
});


async function getAllEntries()
{
  const promise = await urlModel.find({}).sort({short_url: - 1}).exec();
  return promise;
}

async function getEntryById(id)
{
  const promise = await urlModel.find({short_url: id}).exec();
  return promise;
}
  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.use(function(req, res, next){
  res.status(404);
  res.type('txt').send('Not found');
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});
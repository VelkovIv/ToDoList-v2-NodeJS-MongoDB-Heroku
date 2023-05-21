const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require('mongoose');
const _= require('lodash');
const date = require(__dirname + "/date.js");

const app = express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({extended: true}));
app.use(express.static("public"));

// for local Mongo DB
// mongoose.connect('mongodb://127.0.0.1:27017/todolistDB')

mongoose.connect('mongodb+srv://userName:password@todolist.dqr1abz.mongodb.net/todolistDB')

const itemsSchema = new mongoose.Schema({
  name: String
});

const Item = mongoose.model('Item', itemsSchema);

const item1 = new Item ({
  name: 'Welcome to your ToDo list!',
});

const item2 = new Item ({
  name: 'To add new item hit + button.',
});

const item3 = new Item ({
  name: '<-- Hit this to delete an item.',
});

const defaultItems = [item1, item2, item3];

const listSchema = {
  name: String,
  items: [itemsSchema]
};

const List = mongoose.model('List', listSchema);

const day = date.getDate();

app.get("/", function(req, res) {

  Item.find()
    .then(function (foundItems){
      if (foundItems.length === 0) {
        Item.insertMany(defaultItems)
          .then(function () {
              console.log('Succesfully added all the fruits to todolistDB');
          })
          .catch(function (err) {
              console.log(err);
        });
        res.redirect('/');
      } else {
        res.render("list", {listTitle: day, newListItems: foundItems});
      };
      
    })
    .catch( function(err) {
        console.log(err);
    });

});

app.post("/", function(req, res){

  const itemName = req.body.newItem;
  const listName = req.body.list;

  if (itemName != '') {
    const item = new Item ({
      name: itemName,
    });

    if (listName === day) {
      item.save();
      res.redirect('/');
    } else {
      List.findOne({name: listName})
        .then(function(foundList){
          foundList.items.push(item);
          foundList.save();
          res.redirect('/' + listName);
        })
        .catch (function(err){
          console.log(err);
        });
    };
  };
});

app.post('/delete', function(req, res){
  const checkedItemId = req.body.checkbox;
  const listName = req.body.listName;

  if (listName === day) {
    Item.findByIdAndRemove({_id: checkedItemId})
    .then(function(){
        console.log('Succesfully deleted');
    })
    .catch (function(err){
        console.log(err);
    });
    res.redirect('/');
  } else {
    List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}})
      .then(function(foundList){
          res.redirect('/' + listName);
      })
      .catch (function(err){
        console.log(err);
      });
  };
});

app.get("/:listName", function(req,res){
  // console.log(req.params.listName);
  const newList = _.capitalize(req.params.listName);

  List.findOne({name: newList})
    .then(function(foundList){
      if (!foundList){
        // Create a new list
        const list = new List({
          name: newList,
          items: defaultItems
          });
        list.save();
        res.redirect('/' + newList);
      } else {
        // Show existing list
        res.render("list", {listTitle: foundList.name, newListItems: foundList.items});
      };
    })
    .catch (function(err){
      console.log(err);
    });

  });

app.get("/about", function(req, res){
  res.render("about");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function() {
  console.log("Server has started on succesfully");
});

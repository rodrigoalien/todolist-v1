const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect("mongodb://localhost:27017/todolistDB", {useNewUrlParser: true, useUnifiedTopology: true});

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});

const item2 = new Item({
    name: "Hit the + button to add a new item"
});

const item3 = new Item({
    name: "<-- Hit this to delete an item"
});

const defaultItens = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {
    
    Item.find({},function(err, items){
        if(items.length === 0){
            Item.insertMany(defaultItens, function(err){
                if(err){
                    console.log(err);
                } else{
                    console.log("Itens successfully save!");
                }
                res.redirect("/");
            });     
        } else {
            res.render("list", {
                listTitle: "Today",
                newListItem: items
            });
        }
    });
});

app.get("/:listName", function(req, res){
    const listName = _.capitalize(req.params.listName);
    console.log(listName);
    List.findOne({name: listName}, function(err, foundList){
        if(!err){
            if(!foundList){

                const list = new List({
                    name: listName,
                    items: defaultItens
                });
            
                list.save(function(err, result){
                    res.redirect("/" + listName);
                });
            } else{
                res.render("list", {
                    listTitle: foundList.name,
                    newListItem: foundList.items
                });
            }
        } else {
            console.log(err);
        }
    });
});

app.post("/", function(req, res){

    const itemName = req.body.newItem;
    const listName = req.body.list;
    const item = new Item({
        name: itemName
    });
    console.log("post" + listName);
    if(listName === "Today"){
        item.save(function(err, result){
            res.redirect("/");
        });
    } else{
        List.findOne({name: listName}, function(err, foundList){
            foundList.items.push(item);
            foundList.save(function(err, resutl){
                res.redirect("/" + listName);
            });
        });
    }
    
});

app.post("/delete", function(req, res){
    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName;

    if(listName === "Today"){
        Item.findByIdAndRemove(checkedItemId, function(err){
            if(err){
                console.log(err);
            } else{
                console.log("Item successfully deleted!");
                res.redirect("/");
            }
        });
    } else{
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
            if(!err) res.redirect("/" + listName);
        });
    }
});

app.get("/about", function(req, res) {
    res.render("about");
});

app.listen(3000, function(){
    console.log("Server started on port 3000...");
});